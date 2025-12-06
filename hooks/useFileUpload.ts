// hooks/useFileUpload.ts
import { useState } from 'react'
import { toast } from 'sonner'
import { UploadedFile, DocumentType } from '@/lib/types/form'

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false)

  const uploadFile = async (
    file: File,
    documentType: DocumentType,
    clientFolder: string,
    clientFolderId?: string // ✅ RECEVOIR L'ID DU DOSSIER EXISTANT
  ): Promise<{ file: UploadedFile; folderId: string } | null> => {
    setIsUploading(true)

    try {
      const actualClientFolder = clientFolder || `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      console.log('📁 Dossier client utilisé:', actualClientFolder)
      console.log('🆔 ID du dossier existant:', clientFolderId)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)
      formData.append('clientId', actualClientFolder)

      // ✅ PASSER L'ID DU DOSSIER EXISTANT
      if (clientFolderId) {
        formData.append('existingFolderId', clientFolderId)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      const uploadedFile: UploadedFile = {
        fileId: result.publicId,
        url: result.url,
        downloadUrl: result.downloadUrl || result.url,
        name: result.fileInfo?.name || file.name,
        size: result.fileInfo?.size || file.size,
        type: result.fileInfo?.type || file.type,
      }

      toast.success('Fichier uploadé avec succès')

      // ✅ Return the uploaded file info
      return {
        file: uploadedFile,
        folderId: result.cloudinaryInfo?.folder || actualClientFolder
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/upload?fileId=${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      toast.success('Fichier supprimé')
      return true
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Erreur lors de la suppression')
      return false
    }
  }

  return { isUploading, uploadFile, deleteFile }
}