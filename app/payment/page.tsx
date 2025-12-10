"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Wallet, Clock, ArrowLeft, CheckCircle2, Building2, Upload, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ADMIN_PAYMENT_INFO } from '@/lib/constants/adminPayment'

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

function PaymentContent() {
    const searchParams = useSearchParams()
    const clientId = searchParams.get('clientId')
    const [client, setClient] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMethod, setSelectedMethod] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        if (clientId) {
            fetchClientData()
        }
    }, [clientId])

    const fetchClientData = async () => {
        try {
            // Use profile endpoint instead of admin endpoint
            const response = await fetch('/api/clients/profile')
            const data = await response.json()
            
            if (data.success && data.client) {
                setClient(data.client)
                
                // Verify this client matches the URL clientId
                if (clientId && data.client.id !== clientId) {
                    toast.error('Client ID mismatch')
                    return
                }
            } else {
                toast.error('Impossible de charger les données')
            }
        } catch (error) {
            console.error('Error loading client:', error)
            toast.error('Erreur de chargement')
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(field)
            setTimeout(() => setCopied(null), 2000)
            toast.success('Copié!')
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setReceiptFile(file)
        toast.success('Reçu sélectionné')
    }

    const handlePayment = async () => {
        if (!selectedMethod) {
            toast.error('Veuillez sélectionner une méthode de paiement')
            return
        }

        if (selectedMethod === 'baridimob' && !receiptFile) {
            toast.error('Veuillez téléverser votre reçu de paiement')
            return
        }

        setIsProcessing(true)
        try {
            if (selectedMethod === 'baridimob') {
                // Upload receipt first
                const formData = new FormData()
                formData.append('file', receiptFile!)
                formData.append('folder', 'second-payments')

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                const uploadData = await uploadResponse.json()

                if (!uploadData.success) {
                    throw new Error(uploadData.error || 'Échec du téléversement du reçu')
                }

                // Create payment record directly
                const paymentResponse = await fetch('/api/clients/second-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: client.id,
                        amount: client.remainingAmount,
                        paymentMethod: 'baridimob',
                        receiptUrl: uploadData.url
                    })
                })

                const paymentData = await paymentResponse.json()

                if (paymentData.success) {
                    toast.success('Paiement enregistré avec succès!')
                    setTimeout(() => {
                        window.location.href = '/me'
                    }, 2000)
                } else {
                    throw new Error(paymentData.error || 'Erreur lors du traitement')
                }
            } else {
                // CIB payment
                const response = await fetch('/api/process-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientId: client.id,
                        amount: client.remainingAmount,
                        paymentMethod: selectedMethod,
                        isSecondPayment: true
                    })
                })

                const data = await response.json()
                
                if (data.success && data.paymentUrl) {
                    window.location.href = data.paymentUrl
                } else {
                    toast.error(data.error || 'Erreur lors du paiement')
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Erreur de connexion')
        } finally {
            setIsProcessing(false)
        }
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
    if (!client) return <div className="min-h-screen flex items-center justify-center">Client introuvable</div>

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                <Link href="/me" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au tableau de bord
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Paiement du solde restant</CardTitle>
                        <p className="text-gray-600">Complétez votre paiement pour continuer</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="font-semibold text-blue-900 mb-4">Récapitulatif du paiement</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Montant total de l'offre</span>
                                    <span className="font-semibold">{client.totalAmount?.toLocaleString('fr-DZ')} DZD</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Premier paiement (50%)</span>
                                    <span className="font-semibold">- {client.paidAmount?.toLocaleString('fr-DZ')} DZD</span>
                                </div>
                                <div className="border-t border-blue-300 pt-3 flex justify-between text-lg">
                                    <span className="font-bold text-blue-900">Solde à payer</span>
                                    <span className="font-bold text-blue-900">{client.remainingAmount?.toLocaleString('fr-DZ')} DZD</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Choisissez votre méthode de paiement</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setSelectedMethod('cib')}
                                    className={`p-4 border-2 rounded-lg transition-all ${
                                        selectedMethod === 'cib' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <p className="font-medium">CIB</p>
                                    <p className="text-sm text-gray-600">Carte bancaire - Paiement en ligne</p>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('baridimob')}
                                    className={`p-4 border-2 rounded-lg transition-all ${
                                        selectedMethod === 'baridimob' 
                                            ? 'border-orange-500 bg-orange-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                                    <p className="font-medium">CCP / BARIDI MOB</p>
                                    <p className="text-sm text-gray-600">Virement CCP - Algérie Poste</p>
                                </button>
                            </div>
                        </div>

                        {/* BaridiMob Details - Show when BaridiMob selected */}
                        {selectedMethod === 'baridimob' && (
                            <div className="space-y-4">
                                {/* Account Info */}
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Building2 className="h-5 w-5 text-orange-600" />
                                        <h4 className="font-semibold text-gray-900">Informations du compte NCH Community</h4>
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
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                            receiptFile 
                                                ? 'border-green-400 bg-green-50' 
                                                : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                                        }`}>
                                            {receiptFile ? (
                                                <div className="flex items-center justify-center gap-2 text-green-700">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    <span className="font-medium">{receiptFile.name}</span>
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
                                </div>
                            </div>
                        )}

                        {/* Important Notice */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle2 className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold mb-1">Important :</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Ce paiement finalise votre inscription</li>
                                        <li>Votre dossier sera traité immédiatement après confirmation</li>
                                        <li>Vous recevrez un reçu par email</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <Button
                            onClick={handlePayment}
                            disabled={!selectedMethod || isProcessing}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                        >
                            {isProcessing ? (
                                <>Traitement en cours...</>
                            ) : (
                                <>
                                    <CreditCard className="h-5 w-5 mr-2" />
                                    Payer {client.remainingAmount?.toLocaleString('fr-DZ')} DZD
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function PaymentLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
            </div>
        </div>
    )
}

export default function SecondPaymentPage() {
    return (
        <Suspense fallback={<PaymentLoading />}>
            <PaymentContent />
        </Suspense>
    )
}