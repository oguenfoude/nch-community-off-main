'use client'

import { useState } from 'react'
import { Building2, Download, Upload, Copy, Check, FileText, CheckCircle, CreditCard, Wallet } from 'lucide-react'
import { FormData as RegistrationFormData, FormErrors, PaymentMethod } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ADMIN_PAYMENT_INFO } from '@/lib/constants/adminPayment'
import { toast } from 'sonner'

interface PaymentStepProps {
  formData: RegistrationFormData
  errors: FormErrors
  translations: any
  onChange: (data: Partial<RegistrationFormData>) => void
  pendingReceiptFile?: File | null
  onPendingReceiptChange?: (file: File | null) => void
}

// Copy row component
const InfoRow = ({ label, value, onCopy, copied }: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-mono text-gray-900">{value}</p>
    </div>
    <button
      onClick={onCopy}
      type="button"
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="Copier"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400" />
      )}
    </button>
  </div>
)

export const PaymentStep = ({ 
  formData, 
  errors, 
  translations: t, 
  onChange, 
  pendingReceiptFile, 
  onPendingReceiptChange 
}: PaymentStepProps) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const selectPaymentMethod = (method: PaymentMethod) => {
    if (method === 'cib') {
      onChange({ 
        paymentMethod: 'cib',
        paymentType: formData.paymentType || 'full',
      })
      return
    }
    
    if (method === 'baridimob') {
      onChange({ 
        paymentMethod: 'baridimob',
        paymentType: formData.paymentType || 'full',
        baridiMobInfo: {
          email: ADMIN_PAYMENT_INFO.email,
          rip: ADMIN_PAYMENT_INFO.rip,
          ccp: ADMIN_PAYMENT_INFO.ccp,
          key: ADMIN_PAYMENT_INFO.key
        }
      })
      return
    }
  }

  const downloadGuarantee = async () => {
    const name = `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
    const phone = formData.phone
    const offer = formData.selectedOffer

    if (!name || !phone || !offer) {
      toast.error('Veuillez remplir toutes les informations avant de télécharger.')
      return
    }

    try {
      setIsDownloading(true)

      const params = new URLSearchParams({
        name,
        phone,
        offer,
        email: formData.email || '',
        address: formData.wilaya || '',
        format: 'pdf'
      })

      formData.selectedCountries?.forEach(country => {
        params.append('selectedCountries', country)
      })

      const response = await fetch(`/api/generatepdf?${params}`)
      if (!response.ok) throw new Error('Erreur lors de la génération')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'Contrat_Garantie_NCH.docx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Contrat téléchargé avec succès')
    } catch (error) {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez PDF, JPG ou PNG.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux. Max 5MB.')
      return
    }

    onPendingReceiptChange?.(file)
  }

  // Get price based on offer
  const getPrice = (type: 'full' | 'partial') => {
    const prices = {
      basic: { full: '20,000 DZD', partial: '10,500 DZD' },
      premium: { full: '27,000 DZD', partial: '14,000 DZD' },
      gold: { full: '34,000 DZD', partial: '17,500 DZD' }
    }
    return prices[formData.selectedOffer as keyof typeof prices]?.[type] || '—'
  }

  const hasRequiredData = formData.firstName && formData.lastName && formData.phone && formData.selectedOffer

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-[#042d8e]">
          {t.payment?.title || 'Paiement'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">Choisissez votre méthode de paiement</p>
      </div>

      {/* Contract Download */}
      <div className="bg-[#042d8e]/5 border border-[#042d8e]/20 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#042d8e] rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Contrat de Garantie</h4>
            <p className="text-sm text-gray-500">Téléchargez le contrat avant de procéder au paiement</p>
          </div>
          <Button
            type="button"
            onClick={downloadGuarantee}
            disabled={isDownloading || !hasRequiredData}
            className="bg-[#042d8e] hover:bg-[#042d8e]/90"
          >
            <Download className={`h-4 w-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
            {isDownloading ? 'Génération...' : 'Télécharger'}
          </Button>
        </div>
      </div>

      {/* Payment Methods - CIB and BaridiMob Only */}
      <div className="grid grid-cols-2 gap-4">
        {/* CIB - Active */}
        <button
          type="button"
          onClick={() => selectPaymentMethod('cib')}
          className={`border-2 rounded-xl p-4 text-center transition-all ${
            formData.paymentMethod === 'cib'
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900">Carte CIB</p>
          <p className="text-xs text-gray-500 mt-1">Paiement en ligne sécurisé</p>
        </button>

        {/* BaridiMob - Active */}
        <button
          type="button"
          onClick={() => selectPaymentMethod('baridimob')}
          className={`border-2 rounded-xl p-4 text-center transition-all ${
            formData.paymentMethod === 'baridimob'
              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
              : 'border-gray-200 hover:border-orange-300'
          }`}
        >
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-900">CCP / BaridiMob</p>
          <p className="text-xs text-gray-500 mt-1">Virement CCP</p>
        </button>
      </div>

      {/* Payment Type Selection - Shows for BOTH methods */}
      {(formData.paymentMethod === 'cib' || formData.paymentMethod === 'baridimob') && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ paymentType: 'full' })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.paymentType !== 'partial'
                ? 'border-[#042d8e] bg-[#042d8e]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                formData.paymentType !== 'partial' ? 'border-[#042d8e]' : 'border-gray-300'
              }`}>
                {formData.paymentType !== 'partial' && (
                  <div className="w-2 h-2 rounded-full bg-[#042d8e]" />
                )}
              </div>
              <span className="font-medium text-gray-900">Paiement complet</span>
            </div>
            <p className="text-lg font-semibold text-[#042d8e] ml-6">{getPrice('full')}</p>
            <p className="text-xs text-green-600 ml-6">Réduction de 1,000 DZD incluse</p>
          </button>

          <button
            type="button"
            onClick={() => onChange({ paymentType: 'partial' })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.paymentType === 'partial'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                formData.paymentType === 'partial' ? 'border-orange-500' : 'border-gray-300'
              }`}>
                {formData.paymentType === 'partial' && (
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                )}
              </div>
              <span className="font-medium text-gray-900">Paiement en 2 fois</span>
            </div>
            <p className="text-lg font-semibold text-orange-600 ml-6">{getPrice('partial')}</p>
            <p className="text-xs text-gray-500 ml-6">50% maintenant, 50% plus tard</p>
          </button>
        </div>
      )}

      {/* Payment Details (when BaridiMob selected) */}
      {formData.paymentMethod === 'baridimob' && (
        <div className="space-y-4">
          {/* Account Info */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-gray-900">Informations du compte</h4>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-1">
              <InfoRow 
                label="Email"
                value={ADMIN_PAYMENT_INFO.email}
                onCopy={() => copyToClipboard(ADMIN_PAYMENT_INFO.email, 'email')}
                copied={copied === 'email'}
              />
              <InfoRow 
                label="RIP"
                value={ADMIN_PAYMENT_INFO.rip}
                onCopy={() => copyToClipboard(ADMIN_PAYMENT_INFO.rip, 'rip')}
                copied={copied === 'rip'}
              />
              <InfoRow 
                label="CCP (Clé)"
                value={`${ADMIN_PAYMENT_INFO.ccp} — ${ADMIN_PAYMENT_INFO.key}`}
                onCopy={() => copyToClipboard(ADMIN_PAYMENT_INFO.ccp, 'ccp')}
                copied={copied === 'ccp'}
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-5 w-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">
                Reçu de paiement <span className="text-red-500">*</span>
              </h4>
            </div>

            <label className="block cursor-pointer">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleReceiptSelect}
                className="hidden"
              />
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                pendingReceiptFile 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
              }`}>
                {pendingReceiptFile ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{pendingReceiptFile.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cliquez pour téléverser</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG (max 5MB)</p>
                  </>
                )}
              </div>
            </label>

            {pendingReceiptFile && (
              <p className="text-sm text-green-600 mt-2 text-center">
                ✓ Fichier sélectionné, sera envoyé avec le formulaire
              </p>
            )}
          </div>

          {/* Instructions */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800 text-sm">
              <strong>📌 Important:</strong> Vos informations de connexion seront envoyées par email 
              après vérification du paiement (24-48h).
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Error */}
      {errors.paymentMethod && (
        <p className="text-red-500 text-sm text-center">{errors.paymentMethod}</p>
      )}
    </div>
  )
}
