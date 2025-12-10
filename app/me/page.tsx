"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    LogOut,
    Loader2,
    CheckCircle2,
    Clock,
    Circle,
    CreditCard,
    AlertCircle,
    Mail
} from "lucide-react"
import { toast } from "sonner"
import { logoutClient } from "@/lib/actions/auth.actions"
import Link from "next/link"

interface Stage {
    id: string
    stageNumber: number
    stageName: string
    status: string
    notes: string
}

interface Payment {
    id: string
    amount: number
    status: string
    paymentMethod: string
    paymentType: string
    createdAt: string
    receiptUrl?: string
    baridiMobInfo?: {
        email?: string
        rip?: string
        ccp?: string
        key?: string
    }
}

interface ClientData {
    id: string
    firstName: string
    lastName: string
    email: string
    selectedOffer: string
    status: string
    paymentStatus: string
    selectedCountries: string[]
    totalAmount?: number
    paidAmount?: number
    remainingAmount?: number
    hasPendingVerification?: boolean
    stages?: Stage[]
    payments?: Payment[]
}

export default function ClientDashboard() {
    const router = useRouter()
    const [client, setClient] = useState<ClientData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchClientData()
    }, [])

    const fetchClientData = async () => {
        try {
            const [profileRes, stagesRes] = await Promise.all([
                fetch('/api/clients/profile'),
                fetch('/api/clients/stages')
            ])
            const profileData = await profileRes.json()
            const stagesData = await stagesRes.json()

            if (profileData.success) {
                setClient({ ...profileData.client, stages: stagesData.stages || [] })
            } else {
                toast.error('Erreur de chargement')
            }
        } catch {
            toast.error('Erreur de connexion')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        const result = await logoutClient()
        if (result?.redirectTo) {
            window.location.href = result.redirectTo
        }
    }

    const getStageStatus = (stage: Stage) => {
        const s = (stage.status || 'not_started').toLowerCase()
        if (s === 'completed' || s === 'approved') return 'done'
        if (s === 'in_progress' || s === 'processing') return 'current'
        return 'pending'
    }

    const getPaymentBadge = (paymentStatus: string | undefined) => {
        const s = (paymentStatus || 'pending').toLowerCase()
        switch (s) {
            case 'paid':
            case 'verified':
            case 'completed':
                return { text: 'Payé complètement', color: 'bg-green-100 text-green-700 border-green-200' }
            case 'partially_paid':
                return { text: 'Payé 50%', color: 'bg-orange-100 text-orange-700 border-orange-200' }
            default:
                return { text: 'Non payé', color: 'bg-red-100 text-red-700 border-red-200' }
        }
    }

    const getPaymentMethodLabel = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'cib': return 'Carte CIB'
            case 'baridimob': return 'CCP / BaridiMob'
            default: return method || '-'
        }
    }

    const getPaymentStatusLabel = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'En attente de vérification'
            case 'verified': return 'Vérifié'
            case 'completed': return 'Complété'
            case 'failed': return 'Échoué'
            default: return status || '-'
        }
    }

    const getPaymentStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'verified':
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'pending':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'failed':
                return 'bg-red-100 text-red-700 border-red-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const getOfferName = (offer: string | undefined) => {
        switch ((offer || '').toLowerCase()) {
            case 'basic': return 'Basic'
            case 'premium': return 'Premium'
            case 'gold': return 'Gold'
            default: return offer || '-'
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3 text-[#042d8e]" />
                    <p className="text-slate-500">Chargement...</p>
                </div>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">Session expirée</p>
                    <Link href="/login">
                        <Button className="bg-[#042d8e]">Se reconnecter</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const paymentBadge = getPaymentBadge(client.paymentStatus)

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#042d8e] rounded-full flex items-center justify-center text-white font-semibold">
                            {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div>
                            <h1 className="font-semibold text-slate-900">{client.firstName} {client.lastName}</h1>
                            <p className="text-sm text-slate-500">NCH Community</p>
                        </div>
                    </div>
                    <Button onClick={handleLogout} variant="ghost" size="sm" className="text-slate-500 hover:text-red-600">
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                    </Button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                
                {/* Payment Summary - Prominent Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-[#042d8e] to-[#0651c4] text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Résumé du paiement</h2>
                            <Badge className={`${paymentBadge.color} border font-medium px-3 py-1`}>
                                {paymentBadge.text}
                            </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-blue-100 text-sm mb-1">Montant total</p>
                                <p className="text-3xl font-bold">
                                    {client.totalAmount?.toLocaleString('fr-DZ')} DZD
                                </p>
                            </div>
                            <div>
                                <p className="text-blue-100 text-sm mb-1">Montant payé</p>
                                <p className="text-3xl font-bold text-green-300">
                                    {client.paidAmount?.toLocaleString('fr-DZ')} DZD
                                </p>
                            </div>
                            <div>
                                <p className="text-blue-100 text-sm mb-1">Solde restant</p>
                                <p className="text-3xl font-bold text-orange-300">
                                    {client.remainingAmount?.toLocaleString('fr-DZ')} DZD
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Reminder - If partial payment */}
                {client.paymentStatus === 'partially_paid' && client.remainingAmount && client.remainingAmount > 0 && (
                    <Card className="border-2 border-orange-400 bg-orange-50">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-7 w-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-orange-900 mb-2">
                                        ⚠️ Paiement incomplet - Il reste 50% à payer
                                    </h3>
                                    <p className="text-orange-800 mb-4">
                                        Vous avez payé <strong>{client.paidAmount?.toLocaleString('fr-DZ')} DZD</strong> (50%). 
                                        Pour activer complètement votre compte, veuillez payer le solde restant de{' '}
                                        <strong className="text-2xl">{client.remainingAmount?.toLocaleString('fr-DZ')} DZD</strong>.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button 
                                            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-6 text-lg"
                                            onClick={() => router.push('/payment?clientId=' + client.id)}
                                        >
                                            <CreditCard className="h-5 w-5 mr-2" />
                                            Payer maintenant les 50% restants
                                        </Button>
                                        <div className="text-sm text-orange-700 bg-orange-100 p-3 rounded-lg">
                                            💳 Vous pouvez payer par <strong>Carte CIB</strong> ou <strong>CCP/BaridiMob</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm text-slate-500 mb-1">Offre sélectionnée</p>
                            <p className="text-xl font-bold text-[#042d8e]">{getOfferName(client.selectedOffer)}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm text-slate-500 mb-1">Statut du compte</p>
                            <p className="font-semibold text-slate-800 capitalize">{client.status}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm text-slate-500 mb-1">Pays sélectionnés</p>
                            <p className="font-semibold text-slate-800">
                                {client.selectedCountries?.length > 0 
                                    ? client.selectedCountries.join(', ') 
                                    : '-'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment History */}
                {client.payments && client.payments.length > 0 && (
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Historique des paiements</h2>
                            <div className="space-y-3">
                                {client.payments.map((payment, index) => (
                                    <div 
                                        key={payment.id} 
                                        className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    payment.status === 'completed' || payment.status === 'verified'
                                                        ? 'bg-green-100'
                                                        : payment.status === 'pending'
                                                        ? 'bg-blue-100'
                                                        : 'bg-yellow-100'
                                                }`}>
                                                    <CreditCard className={`h-5 w-5 ${
                                                        payment.status === 'completed' || payment.status === 'verified'
                                                            ? 'text-green-600'
                                                            : payment.status === 'pending'
                                                            ? 'text-blue-600'
                                                            : 'text-yellow-600'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        Paiement #{index + 1}
                                                        {payment.paymentType === 'initial' && ' (Premier paiement 50%)'}
                                                        {payment.paymentType === 'second' && ' (Deuxième paiement 50%)'}
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        {getPaymentMethodLabel(payment.paymentMethod)} • {' '}
                                                        {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-[#042d8e]">
                                                    {payment.amount.toLocaleString('fr-DZ')} DZD
                                                </p>
                                                <Badge className={`mt-1 ${getPaymentStatusColor(payment.status)}`}>
                                                    {getPaymentStatusLabel(payment.status)}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Receipt & BaridiMob Info */}
                                        {payment.paymentMethod === 'baridimob' && (
                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                {payment.status === 'pending' && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                                        <div className="flex items-center gap-2 text-blue-800">
                                                            <Clock className="h-4 w-4" />
                                                            <span className="text-sm font-medium">⏳ En cours de vérification par l'équipe</span>
                                                        </div>
                                                        <p className="text-xs text-blue-600 mt-1">Délai : 24-48 heures</p>
                                                    </div>
                                                )}
                                                
                                                {payment.receiptUrl && (
                                                    <div className="mb-2">
                                                        <p className="text-xs text-slate-500 mb-1">Reçu de paiement :</p>
                                                        <a 
                                                            href={payment.receiptUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-sm text-[#042d8e] hover:underline font-medium"
                                                        >
                                                            <CreditCard className="h-4 w-4" />
                                                            Voir le reçu téléchargé
                                                        </a>
                                                    </div>
                                                )}
                                                
                                                {payment.baridiMobInfo && (
                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                                        <p className="text-xs font-semibold text-slate-700 mb-2">Informations du transfert CCP :</p>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            {payment.baridiMobInfo.email && (
                                                                <div>
                                                                    <span className="text-slate-500">Email : </span>
                                                                    <span className="font-medium text-slate-700">{payment.baridiMobInfo.email}</span>
                                                                </div>
                                                            )}
                                                            {payment.baridiMobInfo.rip && (
                                                                <div>
                                                                    <span className="text-slate-500">RIP : </span>
                                                                    <span className="font-mono font-medium text-slate-700">{payment.baridiMobInfo.rip}</span>
                                                                </div>
                                                            )}
                                                            {payment.baridiMobInfo.ccp && payment.baridiMobInfo.key && (
                                                                <div className="col-span-2">
                                                                    <span className="text-slate-500">CCP : </span>
                                                                    <span className="font-mono font-medium text-slate-700">{payment.baridiMobInfo.ccp} Clé {payment.baridiMobInfo.key}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stage Tracker */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-6">Suivi de votre dossier</h2>
                        
                        {client.stages && client.stages.length > 0 ? (
                            <div className="space-y-1">
                                {client.stages.map((stage, index) => {
                                    const stageStatus = getStageStatus(stage)
                                    const isLast = index === client.stages!.length - 1
                                    
                                    return (
                                        <div key={stage.id} className="flex items-start gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                                    stageStatus === 'done' 
                                                        ? 'bg-green-500 border-green-500 text-white' 
                                                        : stageStatus === 'current'
                                                        ? 'bg-[#042d8e] border-[#042d8e] text-white'
                                                        : 'bg-white border-slate-300 text-slate-400'
                                                }`}>
                                                    {stageStatus === 'done' ? (
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    ) : stageStatus === 'current' ? (
                                                        <Clock className="h-5 w-5" />
                                                    ) : (
                                                        <Circle className="h-5 w-5" />
                                                    )}
                                                </div>
                                                {!isLast && (
                                                    <div className={`w-0.5 h-14 ${
                                                        stageStatus === 'done' ? 'bg-green-500' : 'bg-slate-200'
                                                    }`} />
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 pb-6">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="text-sm font-medium text-slate-500">
                                                        Étape {stage.stageNumber}
                                                    </span>
                                                    {stageStatus === 'done' && (
                                                        <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                                            Terminé
                                                        </Badge>
                                                    )}
                                                    {stageStatus === 'current' && (
                                                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                                            En cours
                                                        </Badge>
                                                    )}
                                                </div>
                                                <h3 className={`font-semibold ${
                                                    stageStatus === 'pending' ? 'text-slate-400' : 'text-slate-800'
                                                }`}>
                                                    {stage.stageName}
                                                </h3>
                                                {stage.notes && stageStatus !== 'pending' && (
                                                    <p className="text-sm text-slate-500 mt-1">{stage.notes}</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Clock className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                <p>Votre dossier est en cours de traitement</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Verification Warning - BaridiMob */}
                {client.hasPendingVerification && (
                    <Card className="border-2 border-yellow-300 bg-yellow-50">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-900 mb-2">⏳ Paiement en cours de vérification</h3>
                                    <p className="text-sm text-yellow-800 mb-3">
                                        Votre paiement BaridiMob a bien été reçu et est actuellement en cours de vérification par notre équipe. 
                                        Vous serez notifié dès que votre paiement sera validé.
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-yellow-700">
                                        <Clock className="h-4 w-4" />
                                        <span>Délai de vérification : 24-48 heures</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Help */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Besoin d'aide ?</h2>
                        <a 
                            href="mailto:contact@nch-community.online" 
                            className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                            <Mail className="h-5 w-5 text-[#042d8e]" />
                            <div>
                                <p className="text-sm text-slate-500">Email</p>
                                <p className="font-medium text-slate-800">contact@nch-community.online</p>
                            </div>
                        </a>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
