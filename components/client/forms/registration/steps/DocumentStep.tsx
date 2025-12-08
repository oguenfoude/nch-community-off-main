// components/forms/registration/steps/DocumentsStep.tsx
import { FileUpload } from '@/components/client/forms/shared/FileUpload'
import { BadgeIcon as IdCard, GraduationCap, Camera, FileText, AlertCircle } from 'lucide-react'
import { FormData, UploadedFile, PendingFiles } from '@/lib/types/form'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ✅ Mode immédiat: upload directement vers Google Drive
interface ImmediateModeProps {
  mode?: 'immediate'
  formData: FormData
  onChange: (data: Partial<FormData>) => void
  clientFolder: string
  clientFolderId?: string
  onFolderCreated: (folderId: string) => void
  // Not used in immediate mode
  pendingFiles?: never
  onPendingFileChange?: never
}

// ✅ Mode différé: stocke les fichiers localement pour upload groupé
interface DeferredModeProps {
  mode: 'deferred'
  pendingFiles: PendingFiles
  uploadedFiles: Partial<Record<keyof PendingFiles, UploadedFile | null>>
  onPendingFileChange: (field: keyof PendingFiles, file: File | null, uploadedInfo: UploadedFile | null) => void
  // Not used in deferred mode
  formData?: never
  onChange?: never
  clientFolder?: never
  clientFolderId?: never
  onFolderCreated?: never
}

interface CommonProps {
  errors: any
  translations: any
}

type DocumentsStepProps = CommonProps & (ImmediateModeProps | DeferredModeProps)

export const DocumentsStep = (props: DocumentsStepProps) => {
  const { errors, translations: t, mode = 'immediate' } = props

  // ✅ MODE DIFFÉRÉ: Sélection de fichiers locaux avec auto-upload
  if (mode === 'deferred') {
    const { pendingFiles, uploadedFiles, onPendingFileChange } = props as DeferredModeProps & CommonProps

    // Count required documents
    const hasId = !!pendingFiles.id
    const hasDiploma = !!pendingFiles.diploma
    const hasPhoto = !!pendingFiles.photo
    const completedCount = [hasId, hasDiploma, hasPhoto].filter(Boolean).length

    return (
      <div className="space-y-6">
        {/* Error Message if exists */}
        {errors.documents && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {errors.documents}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ID Document */}
          <FileUpload
            mode="deferred"
            label={t.steps.documents.fields.id.label}
            field="id"
            icon={<IdCard className="w-5 h-5" />}
            pendingFile={pendingFiles.id}
            uploadedFileInfo={uploadedFiles.id || null}
            onFileSelect={(file, uploadedInfo) => onPendingFileChange('id', file, uploadedInfo)}
            error={errors.documents_id}
            isRequired
          />

          {/* Diploma */}
          <FileUpload
            mode="deferred"
            label={t.steps.documents.fields.diploma.label}
            field="diploma"
            icon={<GraduationCap className="w-5 h-5" />}
            pendingFile={pendingFiles.diploma}
            uploadedFileInfo={uploadedFiles.diploma || null}
            onFileSelect={(file, uploadedInfo) => onPendingFileChange('diploma', file, uploadedInfo)}
            error={errors.documents_diploma}
            isRequired
          />

          {/* Work Certificate (Optional) */}
          <FileUpload
            mode="deferred"
            label={`${t.steps.documents.fields.workCertificate.label} (Optionnel)`}
            field="workCertificate"
            icon={<FileText className="w-5 h-5" />}
            pendingFile={pendingFiles.workCertificate}
            uploadedFileInfo={uploadedFiles.workCertificate || null}
            onFileSelect={(file, uploadedInfo) => onPendingFileChange('workCertificate', file, uploadedInfo)}
          />

          {/* Photo */}
          <FileUpload
            mode="deferred"
            label={t.steps.documents.fields.photo.label}
            field="photo"
            icon={<Camera className="w-5 h-5" />}
            pendingFile={pendingFiles.photo}
            uploadedFileInfo={uploadedFiles.photo || null}
            onFileSelect={(file, uploadedInfo) => onPendingFileChange('photo', file, uploadedInfo)}
            error={errors.documents_photo}
            isRequired
          />
        </div>

        {/* Simple Help Text */}
        <p className="text-sm text-center text-gray-500">
          Formats acceptés: PDF, JPG, PNG (max 10 MB)
        </p>
      </div>
    )
  }

  // ✅ MODE IMMÉDIAT: Upload direct vers Google Drive (comportement original)
  const { formData, onChange, clientFolder, clientFolderId, onFolderCreated } = props as ImmediateModeProps & CommonProps

  console.log('📁 DocumentsStep - Dossier client:', clientFolder)
  console.log('🆔 ID du dossier existant:', clientFolderId)

  const updateDocument = (field: keyof FormData['documents'], file: UploadedFile | null) => {
    onChange({
      documents: {
        ...formData.documents,
        [field]: file,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t.steps.documents.title}
        </h2>
        <p className="text-gray-600">
          {t.steps.documents.subtitle}
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-sm text-blue-600 mt-2 space-y-1">
            <p>📁 Dossier: {clientFolder}</p>
            <p>🆔 ID Drive: {clientFolderId || 'Non défini'}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUpload
          mode="immediate"
          label={t.steps.documents.fields.id.label}
          field="id"
          icon={<IdCard className="w-5 h-5" />}
          file={formData.documents.id}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId}
          onFolderCreated={onFolderCreated}
          onChange={(file) => updateDocument('id', file)}
        />

        <FileUpload
          mode="immediate"
          label={t.steps.documents.fields.diploma.label}
          field="diploma"
          icon={<GraduationCap className="w-5 h-5" />}
          file={formData.documents.diploma}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId}
          onFolderCreated={onFolderCreated}
          onChange={(file) => updateDocument('diploma', file)}
        />

        <FileUpload
          mode="immediate"
          label={`${t.steps.documents.fields.workCertificate.label} (Optionnel)`}
          field="workCertificate"
          icon={<FileText className="w-5 h-5" />}
          file={formData.documents.workCertificate}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId}
          onFolderCreated={onFolderCreated}
          onChange={(file) => updateDocument('workCertificate', file)}
        />

        <FileUpload
          mode="immediate"
          label={t.steps.documents.fields.photo.label}
          field="photo"
          icon={<Camera className="w-5 h-5" />}
          file={formData.documents.photo}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId}
          onFolderCreated={onFolderCreated}
          onChange={(file) => updateDocument('photo', file)}
        />
      </div>
    </div>
  )
}