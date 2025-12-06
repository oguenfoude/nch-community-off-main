"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Wallet, Clock, ArrowLeft, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

function PaymentContent() {
    const searchParams = useSearchParams()
    const clientId = searchParams.get('clientId')
    const [client, setClient] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMethod, setSelectedMethod] = useState<string>('')
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        if (clientId) {
            fetchClientData()
        }
    }, [clientId])

    const fetchClientData = async () => {
        try {
            const response = await fetch(`/api/clients/${clientId}`)
            const data = await response.json()
            if (data.success) {
                setClient(data.client)
            }
        } catch (error) {
            toast.error('Erreur de chargement')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!selectedMethod) {
            toast.error('Veuillez sélectionner une méthode de paiement')
            return
        }

        setIsProcessing(true)
        try {
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
                toast.error('Erreur lors du paiement')
            }
        } catch (error) {
            toast.error('Erreur de connexion')
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <p className="text-sm text-gray-600">Carte bancaire</p>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod('edahabia')}
                                    className={`p-4 border-2 rounded-lg transition-all ${
                                        selectedMethod === 'edahabia' 
                                            ? 'border-green-500 bg-green-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Wallet className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <p className="font-medium">EDAHABIA</p>
                                    <p className="text-sm text-gray-600">Carte Edahabia</p>
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
                                    <p className="text-sm text-gray-600">Algérie Poste</p>
                                </button>
                            </div>
                        </div>

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