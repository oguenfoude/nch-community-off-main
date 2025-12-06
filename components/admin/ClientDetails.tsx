import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, FileText, Eye, Download, Upload, Trash2, Loader2, ExternalLink, FolderOpen, Info, Plus, Globe } from "lucide-react"
import type { Client } from "@/lib/types"
import { statusConfig, offerLabels, paymentStatusConfig } from "@/lib/constants"
import { toast } from "sonner"
import StageManagement from "@/components/admin/StageManagement"

interface ClientDetailsProps {
    selectedClient: Client | null
    isUploading: boolean
    onStatusChange: (clientId: string, newStatus: Client["status"]) => void
    onPaymentStatusChange?: (clientId: string, newPaymentStatus: Client["paymentStatus"]) => void
    onDocumentUpload: (clientId: string, documentType: string, file: File) => void
    onDocumentDelete: (clientId: string, documentType: string) => void
    loadingStates?: {
        adding: boolean
        editing: boolean
        deleting: string
        statusUpdate: string
        paymentStatusUpdate: string
        refreshing: boolean
    }
}

export default function ClientDetails({
    selectedClient,
    isUploading,
    onStatusChange,
    onPaymentStatusChange,
    onDocumentUpload,
    onDocumentDelete,
    loadingStates = {
        adding: false,
        editing: false,
        deleting: '',
        statusUpdate: '',
        paymentStatusUpdate: '',
        refreshing: false
    }
}: ClientDetailsProps) {
    const [uploadingDocs, setUploadingDocs] = useState<string[]>([])
    const [viewingDocument, setViewingDocument] = useState<{ url: string; type: string; label: string } | null>(null)
    const [adminUploading, setAdminUploading] = useState<string[]>([])

    const handleAdminUpload = async (clientId: string, documentType: string, file: File) => {
        const validationError = validateFile(file)
        if (validationError) {
            toast.error(validationError)
            return
        }

        setAdminUploading(prev => [...prev, documentType])

        try {
            console.log('📤 Upload admin:', { clientId, documentType, fileName: file.name })

            const formData = new FormData()
            formData.append('file', file)
            formData.append('clientId', clientId)
            formData.append('documentType', documentType)

            if (selectedClient?.driveFolder?.id) {
                formData.append('existingFolderId', selectedClient.driveFolder.id)
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Erreur lors de l\'upload')
            }

            const result = await response.json()
            console.log('✅ Upload réussi:', result)

            const clientResponse = await fetch(`/api/clients/${clientId}`)
            if (!clientResponse.ok) {
                throw new Error('Erreur lors de la récupération des données client')
            }
            const { client: currentClient } = await clientResponse.json()

            const updatedDocuments = {
                ...currentClient.documents,
                [documentType]: {
                    fileId: result.publicId,
                    url: result.url,
                    downloadUrl: result.downloadUrl,
                    name: result.fileInfo.name,
                    size: result.fileInfo.size,
                }
            }

            let updatedDriveFolder = currentClient.driveFolder
            if (result.driveInfo?.folderId && !currentClient.driveFolder?.id) {
                updatedDriveFolder = {
                    name: currentClient.driveFolder?.name || `${currentClient.firstName}_${currentClient.lastName}`,
                    id: result.driveInfo.folderId
                }
            }

            const fullClientUpdate = {
                firstName: currentClient.firstName,
                lastName: currentClient.lastName,
                email: currentClient.email,
                phone: currentClient.phone,
                wilaya: currentClient.wilaya,
                diploma: currentClient.diploma,
                selectedOffer: currentClient.selectedOffer,
                paymentMethod: currentClient.paymentMethod,
                status: currentClient.status,
                paymentStatus: currentClient.paymentStatus,
                selectedCountries: currentClient.selectedCountries || [],
                documents: updatedDocuments,
                driveFolder: updatedDriveFolder,
                createdAt: currentClient.createdAt,
                updatedAt: new Date().toISOString()
            }

            console.log('📝 Mise à jour complète du client:', fullClientUpdate)

            const updateResponse = await fetch(`/api/clients/${clientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fullClientUpdate),
            })

            if (!updateResponse.ok) {
                const errorData = await updateResponse.json()
                console.error('❌ Erreur mise à jour:', errorData)
                throw new Error(errorData.error || 'Erreur lors de la mise à jour en base')
            }

            const updatedClientResponse = await updateResponse.json()
            console.log('✅ Client mis à jour avec succès:', updatedClientResponse)

            toast.success(`Document ${documentType} uploadé et enregistré avec succès`)

            setTimeout(() => {
                window.location.reload()
            }, 1000)

        } catch (error: any) {
            console.error('❌ Erreur upload admin:', error)
            toast.error(error.message || 'Erreur lors de l\'upload')
        } finally {
            setAdminUploading(prev => prev.filter(doc => doc !== documentType))
        }
    }

    const handleReplaceDocument = async (clientId: string, documentType: string, file: File) => {
        if (window.confirm('Êtes-vous sûr de vouloir remplacer ce document ?')) {
            try {
                await onDocumentDelete(clientId, documentType)
                await handleAdminUpload(clientId, documentType, file)
            } catch (error) {
                console.error('Erreur lors du remplacement:', error)
                toast.error('Erreur lors du remplacement du document')
            }
        }
    }

    const getDocumentLoadingState = (documentType: string) => {
        return adminUploading.includes(documentType) || uploadingDocs.includes(documentType)
    }

    const AdminDocumentUpload = ({ documentType, label, required, accept }: {
        documentType: string
        label: string
        required: boolean
        accept: string
    }) => {
        const replaceInputRef = useRef<HTMLInputElement>(null)
        const uploadInputRef = useRef<HTMLInputElement>(null)

        const document = getDocumentInfo(documentType)
        const isLoading = getDocumentLoadingState(documentType)
        const fileInfo = getFileDisplayInfo(document)

        return (
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <FileText className={`h-5 w-5 ${document ? 'text-green-500' : 'text-gray-400'}`} />
                        {document && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                            </div>
                        )}
                        {isLoading && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                <Loader2 className="text-white w-2 h-2 animate-spin" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium flex items-center">
                            {document && (
                                <span className="mr-2">{getFileIcon(document)}</span>
                            )}
                            {label}
                            {required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                            {document ? (
                                <span className="flex items-center space-x-1">
                                    <span>{fileInfo.name}</span>
                                    {fileInfo.size && <span>• {fileInfo.size}</span>}
                                    {fileInfo.type === 'pdf' && (
                                        <span className="text-blue-500">(PDF)</span>
                                    )}
                                </span>
                            ) : (
                                accept.includes('pdf') ? "PDF ou JPEG acceptés" : "JPEG uniquement"
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex space-x-1">
                    {document ? (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(document.url, '_blank')}
                                title="Ouvrir dans un nouvel onglet"
                                disabled={isLoading}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const extension = getFileType(document) === 'pdf' ? 'pdf' : 'jpg'
                                    const filename = `${selectedClient!.firstName}_${selectedClient!.lastName}_${documentType}.${extension}`
                                    downloadGoogleDriveFile(document, filename)
                                }}
                                title="Télécharger"
                                disabled={isLoading}
                            >
                                <Download className="h-4 w-4" />
                            </Button>

                            <div>
                                <input
                                    ref={replaceInputRef}
                                    type="file"
                                    className="hidden"
                                    accept={accept}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file && selectedClient) {
                                            handleReplaceDocument(selectedClient.id, documentType, file)
                                        }
                                        e.target.value = ''
                                    }}
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => replaceInputRef.current?.click()}
                                    disabled={isLoading}
                                    title="Remplacer le document"
                                    className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onDocumentDelete(selectedClient!.id, documentType)}
                                disabled={isLoading || loadingStates.deleting === selectedClient!.id}
                                className="text-red-600 hover:text-red-700"
                                title="Supprimer"
                            >
                                {loadingStates.deleting === selectedClient!.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </>
                    ) : (
                        <div>
                            <input
                                ref={uploadInputRef}
                                type="file"
                                className="hidden"
                                accept={accept}
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file && selectedClient) {
                                        handleAdminUpload(selectedClient.id, documentType, file)
                                    }
                                    e.target.value = ''
                                }}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => uploadInputRef.current?.click()}
                                disabled={isLoading}
                                title="Ajouter un document"
                                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Détails du Client</span>
                        {loadingStates.refreshing && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedClient ? (
                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="info">Informations</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="stages">Étapes</TabsTrigger>
                                <TabsTrigger value="drive">Google Drive</TabsTrigger>
                            </TabsList>

                            {/* ONGLET INFORMATIONS */}
                            <TabsContent value="info" className="space-y-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Nom complet</Label>
                                            <p className="text-lg font-semibold">
                                                {selectedClient.firstName} {selectedClient.lastName}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Email</Label>
                                                <p className="text-sm break-all">{selectedClient.email}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">password</Label>
                                                <p className="text-sm break-all">{selectedClient.password}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Téléphone</Label>
                                                <p className="text-sm">{selectedClient.phone}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Wilaya</Label>
                                                <p className="text-sm">{selectedClient.wilaya}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Diplôme</Label>
                                                <p className="text-sm">{selectedClient.diploma}</p>
                                            </div>
                                        </div>

                                        {/* Section pays de destination */}
                                        <div className="border-t pt-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                        <Globe className="h-4 w-4" />
                                                        Pays de destination
                                                    </Label>
                                                    {selectedClient.selectedCountries && selectedClient.selectedCountries.length > 0 ? (
                                                        <div className="mt-2">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                                    {selectedClient.selectedCountries.length} pay{selectedClient.selectedCountries.length > 1 ? 's' : ''} sélectionné{selectedClient.selectedCountries.length > 1 ? 's' : ''}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedClient.selectedCountries.map((country, index) => (
                                                                    <Badge
                                                                        key={index}
                                                                        variant="secondary"
                                                                        className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                                                                    >
                                                                        🌍 {country}
                                                                    </Badge>
                                                                ))}
                                                            </div>

                                                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                                <p className="text-xs text-gray-600 mb-1">Liste complète :</p>
                                                                <p className="text-sm text-gray-800">
                                                                    {selectedClient.selectedCountries.join(' • ')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-2">
                                                            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                <span className="text-yellow-600">⚠️</span>
                                                                <span className="text-sm text-yellow-800">
                                                                    Aucun pays de destination spécifié
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedClient.selectedCountries && selectedClient.selectedCountries.length > 0 && (
                                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-blue-600">📊</span>
                                                            <span className="text-sm font-medium text-blue-800">Analyse des destinations</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                                            <div>
                                                                <span className="text-blue-600">Nombre total :</span>
                                                                <span className="ml-1 font-medium">{selectedClient.selectedCountries.length}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-blue-600">Type d'offre :</span>
                                                                <span className="ml-1 font-medium capitalize">
                                                                    {selectedClient.selectedOffer}
                                                                    {(() => {
                                                                        const maxCountries = {
                                                                            'basic': 1,
                                                                            'premium': 2,
                                                                            'gold': 5
                                                                        }
                                                                        const max = maxCountries[selectedClient.selectedOffer as keyof typeof maxCountries] || 1
                                                                        const current = selectedClient.selectedCountries.length

                                                                        if (current > max) {
                                                                            return (
                                                                                <span className="ml-2 text-red-600 text-xs">
                                                                                    ⚠️ Dépasse la limite ({max})
                                                                                </span>
                                                                            )
                                                                        }
                                                                        return null
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {(() => {
                                                            const maxCountries = {
                                                                'basic': 1,
                                                                'premium': 2,
                                                                'gold': 5
                                                            }
                                                            const max = maxCountries[selectedClient.selectedOffer as keyof typeof maxCountries] || 1
                                                            const current = selectedClient.selectedCountries.length
                                                            const percentage = Math.min((current / max) * 100, 100)

                                                            return (
                                                                <div className="mt-2">
                                                                    <div className="flex justify-between text-xs text-blue-600 mb-1">
                                                                        <span>Utilisation de l'offre</span>
                                                                        <span>{current}/{max}</span>
                                                                    </div>
                                                                    <div className="w-full bg-blue-100 rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full transition-all duration-300 ${current > max ? 'bg-red-500' : 'bg-blue-500'}`}
                                                                            style={{ width: `${percentage}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations sur l'offre */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Offre et Paiement</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Offre sélectionnée</Label>
                                                <div className="mt-1">
                                                    <Badge variant="outline" className="text-sm">
                                                        {offerLabels[selectedClient.selectedOffer as keyof typeof offerLabels] || selectedClient.selectedOffer}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Méthode de paiement</Label>
                                                <p className="text-sm capitalize">{selectedClient.paymentMethod}</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Statut de paiement</Label>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {onPaymentStatusChange ? (
                                                        <Select
                                                            value={selectedClient.paymentStatus}
                                                            onValueChange={(value) =>
                                                                onPaymentStatusChange(selectedClient.id, value as Client["paymentStatus"])
                                                            }
                                                            disabled={loadingStates.paymentStatusUpdate === selectedClient.id}
                                                        >
                                                            <SelectTrigger className="w-40">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="unpaid">❌ Non payé</SelectItem>
                                                                <SelectItem value="pending">⏳ En attente</SelectItem>
                                                                <SelectItem value="partially_paid">💳 Partiellement payé (50%)</SelectItem>
                                                                <SelectItem value="paid">✅ Payé</SelectItem>
                                                                <SelectItem value="failed">⚠️ Échoué</SelectItem>
                                                                <SelectItem value="refunded">↩️ Remboursé</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Badge className={paymentStatusConfig[selectedClient.paymentStatus]?.color || "bg-gray-100 text-gray-800"}>
                                                            {paymentStatusConfig[selectedClient.paymentStatus]?.label || selectedClient.paymentStatus}
                                                        </Badge>
                                                    )}
                                                    {loadingStates.paymentStatusUpdate === selectedClient.id && (
                                                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statut du dossier */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Statut du Dossier</h4>
                                        <div>
                                            <Label className="text-sm font-medium text-gray-500">Statut actuel</Label>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Select
                                                    value={selectedClient.status}
                                                    onValueChange={(value) =>
                                                        onStatusChange(selectedClient.id, value as Client["status"])
                                                    }
                                                    disabled={loadingStates.statusUpdate === selectedClient.id}
                                                >
                                                    <SelectTrigger className="w-48">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">En attente</SelectItem>
                                                        <SelectItem value="processing">En cours</SelectItem>
                                                        <SelectItem value="approved">Approuvé</SelectItem>
                                                        <SelectItem value="rejected">Rejeté</SelectItem>
                                                        <SelectItem value="completed">Terminé</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {loadingStates.statusUpdate === selectedClient.id && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Historique</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Date de création</Label>
                                                <p className="text-sm">{new Date(selectedClient.createdAt).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium text-gray-500">Dernière mise à jour</Label>
                                                <p className="text-sm">{new Date(selectedClient.updatedAt).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ONGLET DOCUMENTS */}
                            <TabsContent value="documents" className="space-y-4">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                        <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium">Gestion des documents :</p>
                                            <ul className="text-xs mt-1 space-y-1">
                                                <li>• 📄 PDF (documents officiels)</li>
                                                <li>• 🖼️ JPEG/JPG (photos et scans)</li>
                                                <li>• Taille maximale : 10MB par fichier</li>
                                                <li>• ✅ <strong>Admin :</strong> Ajouter/Remplacer/Supprimer</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { key: "id", label: "Carte d'identité", required: true, accept: "image/jpeg,application/pdf" },
                                        { key: "diploma", label: "Diplôme", required: true, accept: "image/jpeg,application/pdf" },
                                        { key: "workCertificate", label: "Attestation de travail", required: false, accept: "image/jpeg,application/pdf" },
                                        { key: "photo", label: "Photo d'identité", required: true, accept: "image/jpeg" },
                                    ].map(({ key, label, required, accept }) => (
                                        <AdminDocumentUpload
                                            key={key}
                                            documentType={key}
                                            label={label}
                                            required={required}
                                            accept={accept}
                                        />
                                    ))}
                                </div>

                                {/* Résumé des documents */}
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="text-sm font-medium mb-2 flex items-center">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Résumé des documents
                                    </h4>
                                    <div className="text-xs text-gray-600">
                                        {(() => {
                                            const docs = selectedClient.documents || {}
                                            const uploadedDocs = Object.values(docs).filter(Boolean).length
                                            const requiredDocs = 3 // id, diploma, photo
                                            const requiredUploaded = ['id', 'diploma', 'photo']
                                                .filter(key => docs[key as keyof typeof docs])
                                                .length

                                            return (
                                                <div className="space-y-1">
                                                    <p>Documents obligatoires: {requiredUploaded}/{requiredDocs}</p>
                                                    <p>Total uploadé: {uploadedDocs} documents</p>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${(requiredUploaded / requiredDocs) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                </div>

                                {/* Indicateur d'activité upload */}
                                {(adminUploading.length > 0 || uploadingDocs.length > 0) && (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                                            <span className="text-sm text-yellow-800">
                                                Upload en cours... ({adminUploading.length + uploadingDocs.length} fichier(s))
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* ✅ NOUVEL ONGLET STAGES */}
                            <TabsContent value="stages" className="space-y-4">
                                <StageManagement clientId={selectedClient.id} />
                            </TabsContent>

                            {/* ONGLET GOOGLE DRIVE */}
                            <TabsContent value="drive" className="space-y-4">
                                {(() => {
                                    const driveInfo = getDriveFolderInfo()
                                    return (
                                        <div className="space-y-4">
                                            {/* Informations du dossier */}
                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-start space-x-3">
                                                    <FolderOpen className="h-5 w-5 text-blue-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-blue-900 mb-2">Dossier Google Drive</h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div>
                                                                <span className="font-medium">Nom du dossier :</span>
                                                                <code className="ml-2 px-2 py-1 bg-white rounded text-xs">
                                                                    {driveInfo?.name || 'Non défini'}
                                                                </code>
                                                            </div>
                                                            {driveInfo?.id && (
                                                                <div>
                                                                    <span className="font-medium">ID Google Drive :</span>
                                                                    <code className="ml-2 px-2 py-1 bg-white rounded text-xs">
                                                                        {driveInfo.id}
                                                                    </code>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {driveInfo?.url && (
                                                            <div className="mt-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => window.open(driveInfo.url!, '_blank')}
                                                                    className="flex items-center"
                                                                >
                                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                                    Ouvrir le dossier Drive
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Liste des fichiers dans le dossier */}
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-gray-900">Fichiers dans Google Drive</h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { key: "id", label: "Carte d'identité" },
                                                        { key: "diploma", label: "Diplôme" },
                                                        { key: "workCertificate", label: "Attestation de travail" },
                                                        { key: "photo", label: "Photo d'identité" },
                                                    ].map(({ key, label }) => {
                                                        const document = getDocumentInfo(key)
                                                        const fileInfo = getFileDisplayInfo(document)

                                                        return (
                                                            <div
                                                                key={key}
                                                                className={`flex items-center justify-between p-3 rounded-lg border ${document ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <span className="text-lg">
                                                                        {document ? getFileIcon(document) : '❌'}
                                                                    </span>
                                                                    <div>
                                                                        <p className="text-sm font-medium">{label}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            {document ? (
                                                                                <>
                                                                                    {fileInfo.name}
                                                                                    {fileInfo.size && ` • ${fileInfo.size}`}
                                                                                    {document.fileId && (
                                                                                        <span className="ml-2 text-blue-600">
                                                                                            ID: {document.fileId.substring(0, 8)}...
                                                                                        </span>
                                                                                    )}
                                                                                </>
                                                                            ) : (
                                                                                'Fichier non uploadé'
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {document && (
                                                                    <div className="flex space-x-1">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => window.open(document.url, '_blank')}
                                                                            title="Ouvrir dans Google Drive"
                                                                        >
                                                                            <ExternalLink className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                const extension = getFileType(document) === 'pdf' ? 'pdf' : 'jpg'
                                                                                const filename = `${selectedClient.firstName}_${selectedClient.lastName}_${key}.${extension}`
                                                                                downloadGoogleDriveFile(document, filename)
                                                                            }}
                                                                            title="Télécharger"
                                                                        >
                                                                            <Download className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Statistiques du dossier */}
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <h4 className="text-sm font-medium mb-2">Statistiques du dossier</h4>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Fichiers uploadés :</span>
                                                        <span className="ml-2 font-medium">
                                                            {Object.values(selectedClient.documents || {}).filter(Boolean).length}/4
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Dossier créé :</span>
                                                        <span className="ml-2 font-medium">
                                                            {driveInfo?.id ? 'Oui' : 'Non'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })()}
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="text-center py-12">
                            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client sélectionné</h3>
                            <p className="text-gray-500">Cliquez sur un client dans le tableau pour voir ses détails</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal pour visualiser les documents */}
            <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            {viewingDocument?.label}
                        </DialogTitle>
                    </DialogHeader>
                    {viewingDocument && (
                        <div className="h-[70vh] overflow-hidden">
                            {viewingDocument.type === 'pdf' ? (
                                <div className="h-full flex flex-col space-y-4">
                                    <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                        <div className="text-center">
                                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-4">Aperçu PDF</p>
                                            <Button
                                                onClick={() => window.open(viewingDocument.url, '_blank')}
                                                className="flex items-center"
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Ouvrir le PDF dans un nouvel onglet
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={viewingDocument.url}
                                    alt={viewingDocument.label}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )

    // Fonctions utilitaires
    function getDocumentInfo(documentType: string) {
        if (!selectedClient?.documents) return null
        const doc = selectedClient.documents[documentType as keyof typeof selectedClient.documents]
        return doc || null
    }

    function isGoogleDriveFile(url: string): boolean {
        return url.includes('drive.google.com') || url.includes('docs.google.com')
    }

    function getFileType(document: any): 'pdf' | 'image' {
        if (!document) return 'image'
        if (document.type) {
            return document.type.includes('pdf') ? 'pdf' : 'image'
        }
        if (document.name) {
            return document.name.toLowerCase().includes('.pdf') ? 'pdf' : 'image'
        }
        if (document.url) {
            return document.url.toLowerCase().includes('pdf') ? 'pdf' : 'image'
        }
        return 'image'
    }

    function getFileIcon(document: any) {
        return getFileType(document) === 'pdf' ? '📄' : '🖼️'
    }

    function getFileDisplayInfo(document: any) {
        if (!document) return { name: 'Non disponible', size: '', type: 'unknown' }
        return {
            name: document.name || 'Document sans nom',
            size: document.size ? `(${formatFileSize(document.size)})` : '',
            type: getFileType(document),
            fileId: document.fileId || null
        }
    }

    function formatFileSize(sizeStr: string): string {
        const size = parseInt(sizeStr)
        if (isNaN(size)) return sizeStr
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
        return `${(size / (1024 * 1024)).toFixed(1)} MB`
    }

    function validateFile(file: File): string | null {
        const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'application/pdf']

        if (file.size > MAX_FILE_SIZE) {
            return `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Type de fichier non autorisé. Formats acceptés: JPEG, JPG, PDF'
        }
        return null
    }

    function handleViewDocument(document: any, label: string) {
        if (!document?.url) return
        const fileType = getFileType(document)
        setViewingDocument({ url: document.url, type: fileType, label })
    }

    async function downloadGoogleDriveFile(document: any, suggestedName: string) {
        try {
            if (!document?.url) {
                throw new Error('URL du document manquante')
            }

            console.log('📽 Téléchargement Google Drive:', { document, suggestedName })

            const downloadUrl = `/api/download?url=${encodeURIComponent(document.url)}&filename=${encodeURIComponent(suggestedName)}`

            const response = await fetch(downloadUrl)
            if (!response.ok) {
                throw new Error(`Erreur API: ${response.status}`)
            }

            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = suggestedName
            link.style.display = 'none'

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            window.URL.revokeObjectURL(blobUrl)
            toast.success('Téléchargement réussi')

        } catch (error: any) {
            console.error('❌ Erreur téléchargement:', error)
            toast.error('Erreur lors du téléchargement')

            if (document?.url) {
                window.open(document.url, '_blank')
            }
        }
    }

    function getDriveFolderInfo() {
        if (!selectedClient?.driveFolder) return null

        return {
            name: selectedClient.driveFolder.name || 'Dossier sans nom',
            id: selectedClient.driveFolder.id || null,
            url: selectedClient.driveFolder.id
                ? `https://drive.google.com/drive/folders/${selectedClient.driveFolder.id}`
                : null
        }
    }
}