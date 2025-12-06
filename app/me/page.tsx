"use client"

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    User,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    CreditCard,
    FileText,
    Calendar,
    LogOut,
    Loader2,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Globe,
    Download,
    Eye,
    Image as ImageIcon,
    File
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Stage {
    id: string
    stageNumber: number
    stageName: string
    status: string
    requiredDocuments: string[]
    notes: string
}

interface ClientData {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    wilaya: string
    diploma: string
    selectedOffer: string
    paymentMethod: string
    paymentType?: string
    status: string
    paymentStatus: string
    selectedCountries: string[]
    createdAt: string
    updatedAt: string
    documents?: any
    driveFolder?: any
    totalAmount?: number
    paidAmount?: number
    remainingAmount?: number
    baridiMobInfo?: any
    stages?: Stage[]
}

export default function ClientDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [client, setClient] = useState<ClientData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'loading') return

        if (!session || session.user.userType !== 'client') {
            router.push('/login')
            return
        }

        fetchClientData()
    }, [session, status, router])

    const fetchClientData = async () => {
        try {
            const [profileResponse, stagesResponse] = await Promise.all([
                fetch('/api/clients/profile'),
                fetch('/api/clients/stages')
            ])

            const profileData = await profileResponse.json()
            const stagesData = await stagesResponse.json()

            if (profileData.success) {
                setClient({ ...profileData.client, stages: stagesData.stages || [] })
            } else {
                setError(profileData.error || 'Erreur de chargement')
                toast.error('Erreur lors du chargement des données')
            }
        } catch (error) {
            console.error('Erreur:', error)
            setError('Erreur de connexion')
            toast.error('Erreur de connexion')
        } finally {
            setIsLoading(false)
        }
    }

    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: '/login' })
            toast.success('Déconnexion réussie')
        } catch (error) {
            toast.error('Erreur lors de la déconnexion')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'approved': return 'bg-green-100 text-green-800 border-green-200'
            case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
            case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'partially_paid': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'pending_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return <Clock className="h-3 w-3" />
            case 'processing': return <Loader2 className="h-3 w-3 animate-spin" />
            case 'approved': return <CheckCircle2 className="h-3 w-3" />
            case 'rejected': return <XCircle className="h-3 w-3" />
            case 'completed': return <CheckCircle2 className="h-3 w-3" />
            case 'partially_paid': return <CreditCard className="h-3 w-3" />
            case 'in_progress': return <Loader2 className="h-3 w-3 animate-spin" />
            case 'pending_review': return <Clock className="h-3 w-3" />
            case 'not_started': return <AlertCircle className="h-3 w-3" />
            default: return <AlertCircle className="h-3 w-3" />
        }
    }

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'En attente'
            case 'processing': return 'En traitement'
            case 'approved': return 'Approuvé'
            case 'rejected': return 'Rejeté'
            case 'completed': return 'Complété'
            case 'partially_paid': return 'Partiellement payé'
            case 'in_progress': return 'En cours'
            case 'pending_review': return 'En attente'
            case 'not_started': return 'Non démarré'
            default: return status
        }
    }

    const getOfferText = (offer: string) => {
        switch (offer.toLowerCase()) {
            case 'basic': return 'Offre Basic'
            case 'premium': return 'Offre Premium'
            case 'gold': return 'Offre Gold'
            default: return offer
        }
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-nch-primary" />
                    <p className="text-gray-600">Chargement de votre espace...</p>
                </div>
            </div>
        )
    }

    if (!session || error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">{error || 'Session expirée'}</p>
                    <Link href="/login" className="text-blue-600 hover:text-blue-500">
                        Se reconnecter
                    </Link>
                </div>
            </div>
        )
    }

    if (!client) return null

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-nch-primary text-white">
                                    {client.firstName[0]}{client.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    Bonjour, {client.firstName} {client.lastName}
                                </h1>
                                <p className="text-sm text-gray-500">Espace Client NCH Community</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Déconnexion
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Statut du dossier */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-nch-primary" />
                                    Statut du dossier
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        Statut général
                                    </label>
                                    <Badge
                                        variant="secondary"
                                        className={`${getStatusColor(client.status)} flex items-center gap-2 w-fit`}
                                    >
                                        {getStatusIcon(client.status)}
                                        {getStatusText(client.status)}
                                    </Badge>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        Statut paiement
                                    </label>
                                    <Badge
                                        variant="secondary"
                                        className={`${getStatusColor(client.paymentStatus)} flex items-center gap-2 w-fit`}
                                    >
                                        {getStatusIcon(client.paymentStatus)}
                                        {getStatusText(client.paymentStatus)}
                                    </Badge>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        Offre sélectionnée
                                    </label>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <p className="text-blue-800 font-medium">{getOfferText(client.selectedOffer)}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        Méthode de paiement
                                    </label>
                                    <div className="flex items-center text-gray-700">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        <span className="capitalize">{client.paymentMethod}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Suivi des étapes - UPDATED */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-nch-primary" />
                                    Suivi des étapes de votre dossier
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                    N° Étape
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Nom de l'étape
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Statut
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Documents à télécharger
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                    Notes
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {client.stages && client.stages.length > 0 ? (
                                                client.stages.map((stage) => (
                                                    <tr key={stage.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                            {stage.stageNumber}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {stage.stageName}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge className={getStatusColor(stage.status)}>
                                                                {getStatusIcon(stage.status)}
                                                                <span className="ml-1">{getStatusText(stage.status)}</span>
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {stage.requiredDocuments.length > 0 
                                                                ? stage.requiredDocuments.join(', ') 
                                                                : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {stage.notes || '-'}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                                        Chargement des étapes...
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Informations personnelles - Row 2 */}
                <div className="grid grid-cols-1 gap-6 mt-6">
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <User className="h-5 w-5 mr-2 text-nch-primary" />
                                    Informations personnelles
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Prénom
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                                {client.firstName}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Email
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                                {client.email}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Wilaya
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                                {client.wilaya}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Date d'inscription
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Nom
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                                {client.lastName}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Téléphone
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                                {client.phone}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Diplôme
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                                                {client.diploma}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-500 mb-1 block">
                                                Date d'inscription
                                            </label>
                                            <div className="flex items-center text-gray-900">
                                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                {client.createdAt
                                                    ? new Date(client.createdAt).toLocaleDateString('fr-FR')
                                                    : 'Non disponible'
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pays sélectionnés */}
                                {client.selectedCountries.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <label className="text-sm font-medium text-gray-500 mb-3 block flex items-center">
                                            <Globe className="h-4 w-4 mr-2" />
                                            Pays sélectionnés
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {client.selectedCountries.map((country, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                    className="bg-green-50 text-green-700 border-green-200"
                                                >
                                                    {country}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Documents Section */}
                {client.documents && Object.keys(client.documents).length > 0 && (
                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-nch-primary" />
                                    Mes Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {Object.entries(client.documents).map(([docType, docData]: [string, any]) => {
                                        if (!docData || !docData.url) return null
                                        
                                        const docLabels: Record<string, string> = {
                                            id: 'Carte d\'identité',
                                            diploma: 'Diplôme',
                                            workCertificate: 'Certificat de travail',
                                            photo: 'Photo',
                                            paymentReceipt: 'Reçu de paiement'
                                        }
                                        
                                        const isImage = docData.url?.includes('/image/') || 
                                                       docData.type?.startsWith('image/') ||
                                                       docData.format === 'jpg' || 
                                                       docData.format === 'png' ||
                                                       docData.format === 'jpeg'
                                        const isPdf = docData.url?.includes('/raw/') || 
                                                     docData.type === 'application/pdf' ||
                                                     docData.format === 'pdf' ||
                                                     docData.name?.endsWith('.pdf')
                                        
                                        return (
                                            <div key={docType} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center">
                                                        {isPdf ? (
                                                            <File className="h-5 w-5 text-red-500 mr-2" />
                                                        ) : (
                                                            <ImageIcon className="h-5 w-5 text-blue-500 mr-2" />
                                                        )}
                                                        <span className="font-medium text-sm">
                                                            {docLabels[docType] || docType}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {isPdf ? 'PDF' : 'Image'}
                                                    </Badge>
                                                </div>
                                                
                                                {/* Preview for images */}
                                                {isImage && docData.url && (
                                                    <div className="mb-3 rounded overflow-hidden border">
                                                        <img 
                                                            src={docData.url} 
                                                            alt={docLabels[docType] || docType}
                                                            className="w-full h-24 object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                
                                                {/* PDF preview placeholder */}
                                                {isPdf && (
                                                    <div className="mb-3 rounded border bg-red-50 h-24 flex items-center justify-center">
                                                        <File className="h-10 w-10 text-red-400" />
                                                    </div>
                                                )}
                                                
                                                <div className="flex gap-2">
                                                    <a
                                                        href={docData.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1"
                                                    >
                                                        <Button size="sm" variant="outline" className="w-full text-xs">
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            Voir
                                                        </Button>
                                                    </a>
                                                    <a
                                                        href={docData.downloadUrl || docData.url}
                                                        download={docData.name || `${docType}.${isPdf ? 'pdf' : 'jpg'}`}
                                                        className="flex-1"
                                                    >
                                                        <Button size="sm" variant="default" className="w-full text-xs bg-nch-primary hover:bg-nch-primary/90">
                                                            <Download className="h-3 w-3 mr-1" />
                                                            Télécharger
                                                        </Button>
                                                    </a>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Payment Reminder Section */}
                {client.paymentStatus === 'partially_paid' && client.stages && (
                    (() => {
                        const stage2 = client.stages.find(s => s.stageNumber === 2)
                        const isStage2Completed = stage2?.status === 'completed'
                        
                        return isStage2Completed ? (
                            <div className="mt-6">
                                <Card className="border-2 border-orange-500 bg-orange-50">
                                    <CardContent className="p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-orange-900 mb-2">
                                                    💳 Paiement du solde requis
                                                </h3>
                                                <p className="text-orange-800 mb-4">
                                                    Félicitations ! Vous avez complété l'étape 2. Pour continuer le traitement 
                                                    de votre dossier, veuillez régler le solde restant.
                                                </p>
                                                
                                                <div className="bg-white rounded-lg p-4 mb-4">
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-600">Montant total</p>
                                                            <p className="text-lg font-bold text-gray-900">
                                                                {client.totalAmount?.toLocaleString('fr-DZ')} DZD
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600">Déjà payé</p>
                                                            <p className="text-lg font-bold text-green-600">
                                                                {client.paidAmount?.toLocaleString('fr-DZ')} DZD
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-600">Solde restant</p>
                                                            <p className="text-lg font-bold text-orange-600">
                                                                {client.remainingAmount?.toLocaleString('fr-DZ')} DZD
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex space-x-3">
                                                    <Button 
                                                        className="bg-orange-600 hover:bg-orange-700 text-white"
                                                        onClick={() => window.location.href = '/payment?clientId=' + client.id}
                                                    >
                                                        <CreditCard className="h-4 w-4 mr-2" />
                                                        Payer maintenant
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                                                    >
                                                        Plus tard
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null
                    })()
                )}

                {/* Section supplémentaire - Aide et contact */}
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Besoin d'aide ?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-blue-900">Support Email</h3>
                                    <p className="text-sm text-blue-700">contact@nch-community.online</p>
                                </div>

                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <h3 className="font-medium text-green-900">Support Téléphone</h3>
                                    <p className="text-sm text-green-700">+213 5 51 56 51 08</p>
                                </div>

                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <a href="/doc.pdf" download="nch_doc.pdf">
                                        <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                        <h3 className="font-medium text-purple-900">Documentation</h3>
                                        <p className="text-sm text-purple-700">Guide utilisateur</p>
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}