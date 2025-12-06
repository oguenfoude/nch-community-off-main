// components/test/DriveUploadTest.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Check, Eye, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UploadedFile {
    id: string
    name: string
    url: string
    downloadUrl: string
    size: string
    type: string
}

export const DriveUploadTest = () => {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileUpload = async (file: File) => {
        if (!file) return

        // ✅ LOGS DÉTAILLÉS DU FICHIER CÔTÉ CLIENT
        console.log('📱 Fichier sélectionné côté client:')
        console.log('  - Nom:', file.name)
        console.log('  - Taille:', file.size, 'bytes')
        console.log('  - Type:', file.type)
        console.log('  - LastModified:', new Date(file.lastModified))

        // ✅ VÉRIFICATION : Fichier vide côté client
        if (file.size === 0) {
            setError("Le fichier sélectionné est vide")
            toast.error("Le fichier sélectionné est vide")
            return
        }

        // Validation basique
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            setError("Fichier trop volumineux (max 10MB)")
            toast.error("Fichier trop volumineux (max 10MB)")
            return
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            setError("Type de fichier non autorisé (PDF, JPG, PNG uniquement)")
            toast.error("Type de fichier non autorisé (PDF, JPG, PNG uniquement)")
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            console.log('📤 Création du FormData...')
            const formData = new FormData()
            formData.append('file', file)
            formData.append('clientId', 'test-client-' + Date.now())
            formData.append('documentType', 'test')

            console.log('📡 Envoi vers le serveur...')
            const response = await fetch('/api/upload/test', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'upload')
            }

            setUploadedFile({
                id: data.publicId,
                name: data.fileInfo.name,
                url: data.url,
                downloadUrl: data.downloadUrl,
                size: data.fileInfo.size,
                type: data.fileInfo.type
            })

            toast.success('Fichier uploadé avec succès sur Google Drive !')

        } catch (error: any) {
            console.error('Upload error:', error)
            setError(error.message || 'Erreur lors de l\'upload')
            toast.error(error.message || 'Erreur lors de l\'upload')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async () => {
        if (!uploadedFile) return

        try {
            const response = await fetch(`/api/upload/test?fileId=${uploadedFile.id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Erreur lors de la suppression')
            }

            setUploadedFile(null)
            toast.success('Fichier supprimé avec succès !')

        } catch (error: any) {
            console.error('Delete error:', error)
            toast.error(error.message || 'Erreur lors de la suppression')
        }
    }

    const openInGoogleDrive = () => {
        if (uploadedFile?.url) {
            window.open(uploadedFile.url, '_blank')
        }
    }

    const downloadFile = () => {
        if (uploadedFile?.downloadUrl) {
            window.open(uploadedFile.downloadUrl, '_blank')
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Test Upload Google Drive
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Zone d'upload */}
                    {!uploadedFile && (
                        <div className="space-y-4">
                            <label
                                htmlFor="test-file-upload"
                                className="block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                        <p className="text-sm text-gray-600">Upload vers Google Drive...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <Upload className="h-12 w-12 text-gray-400" />
                                        <p className="text-sm text-gray-600">
                                            Cliquez pour sélectionner un fichier
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PDF, JPG, PNG (max. 10MB)
                                        </p>
                                    </div>
                                )}

                                <input
                                    id="test-file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleFileUpload(file)
                                    }}
                                    disabled={isUploading}
                                />
                            </label>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fichier uploadé */}
                    {uploadedFile && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <Check className="h-8 w-8 text-green-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-green-800 truncate">
                                        {uploadedFile.name}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Taille: {(parseInt(uploadedFile.size) / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Type: {uploadedFile.type}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={openInGoogleDrive}
                                    className="flex-1"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir dans Drive
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadFile}
                                    className="flex-1"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Télécharger
                                </Button>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="flex-1"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                onClick={() => setUploadedFile(null)}
                                className="w-full"
                            >
                                Uploader un autre fichier
                            </Button>
                        </div>
                    )}

                    {/* Informations de configuration */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">
                            Configuration Google Drive
                        </h3>
                        <div className="text-xs text-blue-600 space-y-1">
                            <p>• Service Account: {process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ Configuré' : '❌ Non configuré'}</p>
                            <p>• Dossier ID: {process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID || 'Création automatique'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}