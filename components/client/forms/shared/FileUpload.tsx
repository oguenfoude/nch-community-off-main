// components/forms/shared/FileUpload.tsx
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload, Check, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { DocumentType, UploadedFile } from '@/lib/types/form'
import { useFileUpload } from '@/hooks/useFileUpload'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'

// ✅ Props for DEFERRED mode (new single-page form with auto-upload)
interface DeferredModeProps {
  mode: 'deferred'
  pendingFile: File | null
  uploadedFileInfo: UploadedFile | null  // ✅ NEW: Store uploaded file info
  onFileSelect: (file: File | null, uploadedInfo: UploadedFile | null) => void  // ✅ UPDATED
  // Not needed in deferred mode
  clientFolder?: never
  clientFolderId?: never
  onFolderCreated?: never
  onChange?: never
  file?: never
}

// ✅ Props for IMMEDIATE mode (original behavior)
interface ImmediateModeProps {
  mode?: 'immediate'
  file: UploadedFile | null
  clientFolder: string
  clientFolderId?: string
  onFolderCreated: (folderId: string) => void
  onChange: (file: UploadedFile | null) => void
  // Not needed in immediate mode
  pendingFile?: never
  onFileSelect?: never
}

// ✅ Common props
interface CommonProps {
  label: string
  field: DocumentType
  icon: React.ReactNode
  disabled?: boolean
}

type FileUploadProps = CommonProps & (DeferredModeProps | ImmediateModeProps)

export const FileUpload = (props: FileUploadProps) => {
  const {
    label,
    field,
    icon,
    disabled = false,
    mode = 'immediate'
  } = props

  const [uploadError, setUploadError] = useState<string | null>(null)
  const { isUploading, uploadFile, deleteFile } = useFileUpload()

  const inputId = `${field}-upload`

  // ✅ Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  // ✅ DEFERRED MODE: Auto-upload immediately when file selected
  if (mode === 'deferred') {
    const { pendingFile, uploadedFileInfo, onFileSelect } = props as DeferredModeProps & CommonProps
    const [isAutoUploading, setIsAutoUploading] = useState(false)

    const handleFileSelect = async (selectedFile: File | null) => {
      if (!selectedFile || disabled) return

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Format non supporté. Utilisez PDF, JPG ou PNG.')
        return
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Fichier trop volumineux. Maximum 10MB.')
        return
      }

      // ✅ AUTO-UPLOAD: Upload to Cloudinary immediately
      setIsAutoUploading(true)
      toast.loading(`📤 Upload en cours: ${selectedFile.name}...`, { id: `upload-${field}` })

      try {
        const uploadResult = await uploadFile(
          selectedFile,
          field,
          `nch-community/temp-uploads`,  // Temp folder for auto-uploads
          undefined
        )

        if (uploadResult) {
          // Store both the File and the uploaded file info
          onFileSelect(selectedFile, uploadResult.file)
          
          // Save to localStorage as backup
          try {
            const existingDrafts = JSON.parse(localStorage.getItem('nch_upload_drafts') || '{}')
            existingDrafts[field] = uploadResult.file
            localStorage.setItem('nch_upload_drafts', JSON.stringify(existingDrafts))
          } catch (e) {
            console.error('Failed to save to localStorage:', e)
          }

          toast.success(`✅ ${selectedFile.name} uploadé avec succès!`, { id: `upload-${field}` })
        } else {
          toast.error(`❌ Échec de l'upload de ${selectedFile.name}`, { id: `upload-${field}` })
        }
      } catch (error) {
        console.error('Auto-upload error:', error)
        toast.error(`❌ Erreur: ${selectedFile.name}`, { id: `upload-${field}` })
      } finally {
        setIsAutoUploading(false)
      }
    }

    const handleRemove = () => {
      onFileSelect(null, null)
      // Remove from localStorage
      try {
        const existingDrafts = JSON.parse(localStorage.getItem('nch_upload_drafts') || '{}')
        delete existingDrafts[field]
        localStorage.setItem('nch_upload_drafts', JSON.stringify(existingDrafts))
      } catch (e) {
        console.error('Failed to remove from localStorage:', e)
      }
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="font-semibold text-base sm:text-lg flex items-center gap-2">
          {icon}
          {label}
        </Label>

        {isAutoUploading && <LoadingOverlay message={`Upload de ${label} en cours...`} />}

        <label
          htmlFor={inputId}
          className={`block cursor-pointer border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            uploadedFileInfo || pendingFile
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 hover:border-nch-primary'
          } ${disabled || isAutoUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {!pendingFile && !uploadedFileInfo ? (
            <>
              <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              <p className="mt-2 text-xs sm:text-sm text-gray-600">Cliquez pour sélectionner</p>
              <p className="text-xs text-gray-500">PDF, JPG, PNG (max. 10MB)</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">✨ Upload automatique immédiat</p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-6 w-6 text-green-600" />
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-green-700 font-medium break-all">
                  ✅ {pendingFile?.name}
                </p>
                {pendingFile && (
                  <p className="text-xs text-gray-500">
                    {formatFileSize(pendingFile.size)}
                  </p>
                )}
                {uploadedFileInfo && (
                  <p className="text-xs text-green-600 font-medium">
                    ☁️ Sauvegardé sur le cloud
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemove()
                }}
                disabled={isAutoUploading}
                className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Retirer
              </Button>
            </div>
          )}

          <input
            type="file"
            id={inputId}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            disabled={disabled}
          />
        </label>
      </div>
    )
  }

  // ✅ IMMEDIATE MODE: Original behavior (upload immediately)
  const { file, clientFolder, clientFolderId, onFolderCreated, onChange } = props as ImmediateModeProps & CommonProps

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile || disabled) return

    setUploadError(null)

    const uploadResult = await uploadFile(selectedFile, field, clientFolder, clientFolderId)

    if (uploadResult) {
      onChange(uploadResult.file)

      if (uploadResult.folderId && !clientFolderId) {
        onFolderCreated(uploadResult.folderId)
      }
    } else {
      setUploadError('Erreur lors de l\'upload')
    }
  }

  const handleDelete = async () => {
    if (!file?.fileId) return

    const success = await deleteFile(file.fileId)
    if (success) {
      onChange(null)
      setUploadError(null)
    }
  }

  const openInGoogleDrive = () => {
    if (file?.url) {
      window.open(file.url, '_blank')
    }
  }

  const downloadFile = () => {
    if (file?.downloadUrl) {
      window.open(file.downloadUrl, '_blank')
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="font-semibold text-base sm:text-lg flex items-center gap-2">
        {icon}
        {label}
      </Label>

      <label
        htmlFor={inputId}
        className={`block cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-nch-primary transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
      >
        {!file ? (
          <>
            {isUploading ? (
              <div className="flex flex-col items-center justify-center">
                <LoadingOverlay />
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nch-primary" />
                <p className="mt-2 text-sm text-gray-600">Upload vers Google Drive...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <p className="mt-2 text-xs sm:text-sm text-gray-600">Cliquez pour télécharger</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG (max. 10MB)</p>
                <p className="text-xs text-blue-500 mt-1">📁 Stockage Google Drive</p>
              </>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <Check className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-green-500" />
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-green-600 font-medium break-all">
                {file.name}
              </p>
              <p className="text-xs text-gray-500">
                Taille: {formatFileSize(parseInt(file.size) || 0)}
              </p>
              <p className="text-xs text-blue-500">📁 Stocké sur Google Drive</p>

              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    openInGoogleDrive()
                  }}
                  className="p-2"
                  title="Voir dans Google Drive"
                >
                  <Eye className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    downloadFile()
                  }}
                  className="p-2"
                  title="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete()
                  }}
                  className="p-2 hover:bg-red-50"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          id={inputId}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          disabled={isUploading || disabled}
        />
      </label>

      {uploadError && (
        <p className="text-xs text-red-500 text-center">{uploadError}</p>
      )}
    </div>
  )
}