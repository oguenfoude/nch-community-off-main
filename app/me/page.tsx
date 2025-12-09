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
    Phone,
    Mail
} from "lucide-react"
import { toast } from "sonner"
import { logout } from "@/lib/actions/auth.actions"
import Link from "next/link"

interface Stage {
    id: string
    stageNumber: number
    stageName: string
    status: string
    notes: string
}

interface ClientData {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    selectedOffer: string
    status: string
    paymentStatus: string
    selectedCountries: string[]
    totalAmount?: number
    paidAmount?: number
    remainingAmount?: number
    stages?: Stage[]
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
        await logout()
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
                return { text: 'Payé', color: 'bg-green-100 text-green-700 border-green-200' }
            case 'partially_paid':
                return { text: 'Partiel', color: 'bg-orange-100 text-orange-700 border-orange-200' }
            default:
                return { text: 'En attente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
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
                
                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm text-slate-500 mb-1">Offre</p>
                            <p className="text-xl font-bold text-[#042d8e]">{getOfferName(client.selectedOffer)}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm text-slate-500 mb-1">Paiement</p>
                            <Badge className={`${paymentBadge.color} border font-medium`}>
                                {paymentBadge.text}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <p className="text-sm text-slate-500 mb-1">Pays</p>
                            <p className="font-semibold text-slate-800">
                                {client.selectedCountries?.length > 0 
                                    ? client.selectedCountries.join(', ') 
                                    : '-'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

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

                {/* Payment Reminder */}
                {client.paymentStatus === 'partially_paid' && client.remainingAmount && client.remainingAmount > 0 && (
                    <Card className="border-2 border-orange-300 bg-orange-50">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-orange-900 mb-1">Solde restant</h3>
                                    <p className="text-2xl font-bold text-orange-700 mb-3">
                                        {client.remainingAmount.toLocaleString('fr-DZ')} DZD
                                    </p>
                                    <Button 
                                        className="bg-orange-600 hover:bg-orange-700"
                                        onClick={() => router.push('/payment?clientId=' + client.id)}
                                    >
                                        Payer maintenant
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Help */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Besoin d'aide ?</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <a 
                                href="tel:+213551565108" 
                                className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <Phone className="h-5 w-5 text-[#042d8e]" />
                                <div>
                                    <p className="text-sm text-slate-500">Téléphone</p>
                                    <p className="font-medium text-slate-800">+213 5 51 56 51 08</p>
                                </div>
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
