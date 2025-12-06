// components/forms/registration/steps/PaymentStep.tsx
import { PaymentOption } from '@/components/client/forms/shared/PaymentOption'
import { CreditCard, Wallet, Building2, Clock, Download, FileText, Upload, CheckCircle, Copy, Check } from 'lucide-react'
import { FormData as RegistrationFormData, FormErrors, PaymentMethod, PendingFiles } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { ADMIN_PAYMENT_INFO } from '@/lib/constants/adminPayment'
import { toast } from 'sonner'

interface PaymentStepProps {
  formData: RegistrationFormData
  errors: FormErrors
  translations: any
  onChange: (data: Partial<RegistrationFormData>) => void
  // NEW: For deferred receipt upload
  pendingReceiptFile?: File | null
  onPendingReceiptChange?: (file: File | null) => void
}

// Helper component for payment info rows with copy button (Bilingual)
const PaymentInfoRow = ({ labelAr, labelFr, value, onCopy, copied }: {
  labelAr: string
  labelFr: string
  value: string
  onCopy: () => void
  copied: boolean
}) => (
  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors">
    <div className="text-right flex-1 mr-3">
      <div className="mb-1" dir="rtl">
        <span className="font-semibold text-gray-900">{labelAr}:</span>{' '}
        <span className="text-gray-700 font-mono text-sm">{value}</span>
      </div>
      <div className="text-left">
        <span className="font-semibold text-gray-600 text-xs">{labelFr}:</span>{' '}
        <span className="text-gray-600 font-mono text-xs">{value}</span>
      </div>
    </div>
    <button
      onClick={onCopy}
      type="button"
      className="p-2 hover:bg-orange-100 rounded transition-colors flex-shrink-0"
      title="نسخ / Copier"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4 text-orange-600" />
      )}
    </button>
  </div>
)

export const PaymentStep = ({ formData, errors, translations: t, onChange, pendingReceiptFile, onPendingReceiptChange }: PaymentStepProps) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showBaridiMobInfo, setShowBaridiMobInfo] = useState(formData.paymentMethod === 'baridimob')
  const [copied, setCopied] = useState<string | null>(null)

  // Use prop for receipt file if provided, otherwise local state
  const receiptFile = pendingReceiptFile

  const selectPaymentMethod = (method: PaymentMethod) => {
    // Only BaridiMob is available for now
    if (method !== 'baridimob') {
      toast.error('Cette méthode de paiement n\'est pas disponible pour le moment. Veuillez utiliser CCP / BaridiMob.')
      return
    }
    
    // Set both paymentMethod AND default paymentType when selecting a method
    const updates: Partial<RegistrationFormData> = { 
      paymentMethod: method,
      paymentType: formData.paymentType || 'full' // Set default to 'full' if not already set
    }
    
    // Add baridiMobInfo when BaridiMob is selected (with admin payment details)
    if (method === 'baridimob') {
      updates.baridiMobInfo = {
        fullName: ADMIN_PAYMENT_INFO.fullName,
        wilaya: ADMIN_PAYMENT_INFO.wilaya,
        rip: ADMIN_PAYMENT_INFO.rip,
        ccp: ADMIN_PAYMENT_INFO.ccp,
        key: ADMIN_PAYMENT_INFO.key
      }
      setShowBaridiMobInfo(true)
    } else {
      updates.baridiMobInfo = undefined
      setShowBaridiMobInfo(false)
      // Clear pending receipt when switching away from BaridiMob
      if (onPendingReceiptChange) {
        onPendingReceiptChange(null)
      }
    }
    
    onChange(updates)
  }

  // Copy to clipboard handler
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field)
      setTimeout(() => setCopied(null), 2000)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // Download guarantee
  const downloadGuarantee = async () => {
    try {
      setIsDownloading(true)

      const name = formData.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Client NCH'
      const phone = formData.phone || '0000000000'
      const offer = formData.selectedOffer || 'basic'
      const email = formData.email || ''
      const address = formData.address || ''
      const selectedCountries = formData.selectedCountries || []

      if (!name || !phone || !offer) {
        alert('Veuillez remplir toutes les informations du formulaire avant de télécharger la garantie.')
        return
      }

      const url = `/api/generatepdf?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&offer=${encodeURIComponent(offer)}&email=${encodeURIComponent(email)}&address=${encodeURIComponent(address)}&format=pdf&${selectedCountries.map(country => `selectedCountries=${encodeURIComponent(country)}`).join('&')}`

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF')
      }

      const blob = await response.blob()
      const fileUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = fileUrl
      link.download = 'Contrat_Garantie_NCH.docx'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(fileUrl)

    } catch (error) {
      console.error('❌ Erreur téléchargement PDF:', error)
      alert(`Erreur lors du téléchargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setIsDownloading(false)
    }
  }

  // ✅ DEFERRED MODE: Just store the file, don't upload yet
  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Format non supporté. Veuillez télécharger un PDF ou une image (JPG, PNG)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux. Taille maximale : 5MB')
      return
    }

    // Store the file in pending files (deferred upload)
    if (onPendingReceiptChange) {
      onPendingReceiptChange(file)
    }
  }

  const hasRequiredData = () => {
    const name = formData.name || (formData.firstName && formData.lastName)
    const phone = formData.phone
    const offer = formData.offer || formData.selectedOffer

    return name && phone && offer
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section de téléchargement de la garantie */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-semibold text-blue-900 mb-1">
                  Contrat de Garantie
                </h4>
                <p className="text-sm text-blue-700">
                  Téléchargez notre contrat de garantie de services professionnels
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={downloadGuarantee}
              disabled={isDownloading || !hasRequiredData()}
              className="flex items-center gap-2 w-full sm:w-auto bg-white hover:bg-blue-50 text-blue-600 border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Génération...' : 'Télécharger'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 sm:space-y-6">
        <h3 className="text-lg sm:text-xl font-semibold text-center text-nch-primary mb-4 sm:mb-6">
          {t.payment.title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* CIB - Disabled for now */}
          <div className="relative">
            <div className="opacity-50 pointer-events-none">
              <PaymentOption
                id="cib"
                title={t.payment.cib}
                description={t.payment.descriptions.cib}
                icon={
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                }
                selected={false}
                onClick={() => {}}
              />
            </div>
            <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              Bientôt disponible
            </div>
          </div>

          {/* Edahabia - Disabled for now */}
          <div className="relative">
            <div className="opacity-50 pointer-events-none">
              <PaymentOption
                id="edahabia"
                title={t.payment.edahabia}
                description={t.payment.descriptions.edahabia}
                icon={
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                    <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                }
                selected={false}
                onClick={() => {}}
              />
            </div>
            <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
              Bientôt disponible
            </div>
          </div>

          {/* BaridiMob - Active */}
          <PaymentOption
            id="baridimob"
            title="CCP / BARIDI MOB"
            description="Paiement via Algérie Poste"
            icon={
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            }
            selected={formData.paymentMethod === 'baridimob'}
            onClick={() => selectPaymentMethod('baridimob')}
          />
        </div>

        {/* ✅ Payment Amount Selection - Available for ALL payment methods */}
        {formData.paymentMethod && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-900">
              Montant du paiement
              <span className="text-sm font-normal text-gray-600 mr-2" dir="rtl">مبلغ الدفع</span>
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="paymentType"
                  value="full"
                  checked={!formData.paymentType || formData.paymentType === 'full'}
                  onChange={() => onChange({ paymentType: 'full' })}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Paiement complet (100%)
                    <span className="mr-2 text-sm" dir="rtl">دفع كامل</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.selectedOffer === 'basic' && '20,000 DZD (avec réduction de 1,000 DZD)'}
                    {formData.selectedOffer === 'premium' && '27,000 DZD (avec réduction de 1,000 DZD)'}
                    {formData.selectedOffer === 'gold' && '34,000 DZD (avec réduction de 1,000 DZD)'}
                  </p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-orange-200 bg-orange-50">
                <input
                  type="radio"
                  name="paymentType"
                  value="partial"
                  checked={formData.paymentType === 'partial'}
                  onChange={() => onChange({ paymentType: 'partial' })}
                  className="w-4 h-4 text-orange-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Paiement partiel (50%)
                    <span className="mr-2 text-sm" dir="rtl">دفع جزئي</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {formData.selectedOffer === 'basic' && 'Maintenant: 10,500 DZD • Solde: 10,500 DZD'}
                    {formData.selectedOffer === 'premium' && 'Maintenant: 14,000 DZD • Solde: 14,000 DZD'}
                    {formData.selectedOffer === 'gold' && 'Maintenant: 17,500 DZD • Solde: 17,500 DZD'}
                  </p>
                </div>
              </label>
            </div>
            
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-1">
                💡 <strong>Note:</strong> Le paiement partiel permet de réserver votre place. 
                Le solde restant sera à régler avant le traitement complet de votre dossier.
              </p>
              <p className="text-sm text-blue-700" dir="rtl">
                💡 <strong>ملاحظة:</strong> يتيح لك الدفع الجزئي حجز مكانك. 
                يجب دفع الرصيد المتبقي قبل المعالجة الكاملة لملفك.
              </p>
            </div>
          </div>
        )}

        {/* ✅ BaridiMob Payment Information - Admin Account Details (Bilingual) */}
        {showBaridiMobInfo && (
          <Card className="bg-orange-50 border-orange-200 mt-6">
            <CardContent className="p-6 space-y-6">
              {/* Bilingual Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3" dir="rtl">
                  <Building2 className="h-8 w-8 text-orange-600" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 text-lg">
                      معلومات الدفع - أرسل المبلغ إلى الحساب التالي
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-orange-600 opacity-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-800 text-base">
                      Informations de paiement - Envoyez le montant au compte suivant
                    </h4>
                  </div>
                </div>
              </div>

              {/* Admin Payment Information Display (Bilingual) */}
              <div className="space-y-3 bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-lg border-2 border-orange-300">
                <PaymentInfoRow 
                  labelAr="الإسم الكامل"
                  labelFr="Nom complet"
                  value={ADMIN_PAYMENT_INFO.fullName}
                  onCopy={() => copyToClipboard(ADMIN_PAYMENT_INFO.fullName, 'name')}
                  copied={copied === 'name'}
                />
                <PaymentInfoRow 
                  labelAr="الولاية"
                  labelFr="Wilaya"
                  value={ADMIN_PAYMENT_INFO.wilaya}
                  onCopy={() => copyToClipboard(ADMIN_PAYMENT_INFO.wilaya, 'wilaya')}
                  copied={copied === 'wilaya'}
                />
                <PaymentInfoRow 
                  labelAr="RIP"
                  labelFr="RIP (Relevé d'Identité Postal)"
                  value={ADMIN_PAYMENT_INFO.rip}
                  onCopy={() => copyToClipboard(ADMIN_PAYMENT_INFO.rip, 'rip')}
                  copied={copied === 'rip'}
                />
                <PaymentInfoRow 
                  labelAr="CCP"
                  labelFr="Numéro CCP"
                  value={`${ADMIN_PAYMENT_INFO.ccp} — Clé: ${ADMIN_PAYMENT_INFO.key}`}
                  onCopy={() => copyToClipboard(ADMIN_PAYMENT_INFO.ccp, 'ccp')}
                  copied={copied === 'ccp'}
                />
              </div>

              {/* Bilingual Instructions Alert */}
              <Alert className="bg-yellow-50 border-yellow-300">
                <AlertDescription className="space-y-4">
                  {/* Arabic Instructions */}
                  <div className="text-yellow-900 text-sm" dir="rtl">
                    <p className="font-semibold mb-2">⚠️ تعليمات الدفع:</p>
                    <ul className="list-disc list-inside space-y-1 mr-4">
                      <li>قم بتحويل المبلغ إلى الحساب أعلاه</li>
                      <li>احتفظ بإيصال الدفع (لقطة شاشة أو صورة)</li>
                      <li>قم بتحميل الإيصال في الحقل أدناه</li>
                      <li>سيتم التحقق من الدفع خلال 24-48 ساعة</li>
                    </ul>
                  </div>
                  
                  {/* French Instructions */}
                  <div className="text-yellow-800 text-sm border-t border-yellow-200 pt-3">
                    <p className="font-semibold mb-2">⚠️ Instructions de paiement:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Transférez le montant au compte ci-dessus</li>
                      <li>Conservez le reçu de paiement (capture d'écran ou photo)</li>
                      <li>Téléversez le reçu dans le champ ci-dessous</li>
                      <li>Le paiement sera vérifié sous 24-48 heures</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Receipt Upload Section (Bilingual) */}
              <div className="space-y-4 bg-white p-6 rounded-lg border-2 border-orange-200">
                <div className="flex items-start gap-3">
                  <Upload className="h-5 w-5 text-orange-600 flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-3">
                    {/* Arabic Title */}
                    <div dir="rtl">
                      <p className="font-medium text-gray-900 mb-1">
                        تحميل إيصال الدفع <span className="text-red-500">*</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        بعد إتمام الدفع، يرجى إرفاق صورة الإيصال (PDF، JPG، PNG)
                      </p>
                    </div>
                    
                    {/* French Title */}
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        Téléverser le reçu de paiement <span className="text-red-500">*</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Après avoir effectué le paiement, veuillez joindre une photo du reçu (PDF, JPG, PNG)
                      </p>
                    </div>
                    
                    <label className="block">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleReceiptSelect}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label
                        htmlFor="receipt-upload"
                        className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                      >
                        <Upload className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">
                          {receiptFile 
                            ? `✓ ${receiptFile.name}` 
                            : 'انقر للتحميل / Cliquez pour téléverser'}
                        </span>
                      </label>
                    </label>

                    {receiptFile && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800 space-y-1">
                          <p className="font-medium">✅ تم اختيار الإيصال - سيتم تحميله عند الإرسال</p>
                          <p className="text-sm">✅ Reçu sélectionné - sera téléversé lors de l'envoi</p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>

              {/* Important Notice (Bilingual) */}
              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription className="space-y-2">
                  <p className="text-blue-800 text-sm" dir="rtl">
                    <strong>📌 مهم:</strong> سيتم إرسال معلومات تسجيل الدخول إلى البريد الإلكتروني المسجل بعد التحقق من إيصال الدفع (خلال 24-48 ساعة).
                  </p>
                  <p className="text-blue-700 text-sm border-t border-blue-200 pt-2">
                    <strong>📌 Important:</strong> Les informations de connexion seront envoyées à l'e-mail enregistré après vérification du reçu de paiement (sous 24-48h).
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {errors.paymentMethod && (
          <p className="text-red-500 text-sm text-center">{errors.paymentMethod}</p>
        )}

        {/* Note informative (Bilingual) */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Conseil:</strong> Nous recommandons de télécharger et lire le contrat de garantie
            avant de procéder au paiement.
          </p>
          <p className="text-sm text-gray-600 text-center" dir="rtl">
            💡 <strong>نصيحة:</strong> نوصي بتنزيل وقراءة عقد الضمان قبل متابعة الدفع.
          </p>
        </div>
      </div>
    </div>
  )
}