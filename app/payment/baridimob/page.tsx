"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Upload, CheckCircle, Copy, Check, ArrowLeft } from "lucide-react"
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

function BaridiMobPaymentContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const sessionToken = searchParams.get('token')
    
    const [paymentDetails, setPaymentDetails] = useState<any>(null)
    const [receiptFile, setReceiptFile] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)

    useEffect(() => {
        if (sessionToken) {
            fetchPaymentDetails()
        }
    }, [sessionToken])

    const fetchPaymentDetails = async () => {
        try {
            // Get payment details from pending registration
            const response = await fetch(`/api/payment-details?token=${sessionToken}`)
            const data = await response.json()
            
            if (data.success) {
                setPaymentDetails(data.details)
            } else {
                toast.error('Session de paiement invalide')
            }
        } catch (error) {
            console.error('Error loading payment details:', error)
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

    const handleSubmit = async () => {
        if (!receiptFile) {
            toast.error('Veuillez téléverser votre reçu de paiement')
            return
        }

        setIsSubmitting(true)
        try {
            // Upload receipt to Cloudinary
            const formData = new FormData()
            formData.append('file', receiptFile)
            formData.append('sessionToken', sessionToken!)

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            const uploadData = await uploadResponse.json()

            if (!uploadData.success) {
                throw new Error('Échec du téléversement du reçu')
            }

            // Submit payment with receipt URL
            const paymentResponse = await fetch('/api/baridimob-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionToken,
                    receiptUrl: uploadData.url
                })
            })

            const paymentData = await paymentResponse.json()

            if (paymentData.success) {
                toast.success('Paiement enregistré avec succès!')
                setTimeout(() => {
                    router.push('/me')
                }, 2000)
            } else {
                throw new Error(paymentData.error || 'Erreur lors du traitement')
            }
        } catch (error: any) {
            console.error('Payment submission error:', error)
            toast.error(error.message || 'Erreur lors du paiement')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
    }

    if (!paymentDetails) {
        return <div className="min-h-screen flex items-center justify-center">Session invalide</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                <Link href="/me" className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au tableau de bord
                </Link>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            <Building2 className="h-7 w-7 text-orange-600" />
                            Paiement CCP / BaridiMob
                        </CardTitle>
                        <p className="text-gray-600">Montant à payer : <strong className="text-2xl text-orange-600">{paymentDetails.amount?.toLocaleString('fr-DZ')} DZD</strong></p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Account Info */}
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                            <h3 className="font-semibold text-orange-900 mb-4">
                                Informations du compte NCH Community
                            </h3>
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

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                            <h4 className="font-semibold text-blue-900 mb-3">📝 Instructions</h4>
                            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                                <li>Effectuez le virement de <strong>{paymentDetails.amount?.toLocaleString('fr-DZ')} DZD</strong> vers le compte ci-dessus</li>
                                <li>Conservez le reçu de paiement (capture d'écran ou PDF)</li>
                                <li>Téléversez le reçu ci-dessous</li>
                                <li>Validez pour finaliser votre paiement</li>
                            </ol>
                        </div>

                        {/* Receipt Upload */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                Reçu de paiement <span className="text-red-500">*</span>
                            </h4>

                            <label className="block cursor-pointer">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    receiptFile 
                                        ? 'border-green-400 bg-green-50' 
                                        : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                                }`}>
                                    {receiptFile ? (
                                        <div className="flex flex-col items-center gap-2 text-green-700">
                                            <CheckCircle className="h-12 w-12" />
                                            <span className="font-medium text-lg">{receiptFile.name}</span>
                                            <span className="text-sm text-gray-600">Cliquez pour changer</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-base text-gray-700 font-medium">Cliquez pour téléverser votre reçu</p>
                                            <p className="text-sm text-gray-500 mt-2">PDF, JPG ou PNG (max 5MB)</p>
                                        </>
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            onClick={handleSubmit}
                            disabled={!receiptFile || isSubmitting}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg font-semibold"
                        >
                            {isSubmitting ? (
                                <>Traitement en cours...</>
                            ) : (
                                <>
                                    <CheckCircle className="h-5 w-5 mr-2" />
                                    Valider le paiement
                                </>
                            )}
                        </Button>

                        {/* Notice */}
                        <div className="text-center text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p>⏱️ <strong>Délai de vérification : 24-48 heures</strong></p>
                            <p className="mt-1">Vous serez notifié par email une fois votre paiement vérifié.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function BaridiMobPaymentPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
            <BaridiMobPaymentContent />
        </Suspense>
    )
}
