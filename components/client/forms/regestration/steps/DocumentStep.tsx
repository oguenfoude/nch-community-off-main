// components/forms/registration/steps/DocumentsStep.tsx
import { FileUpload } from '@/components/client/forms/shared/FileUpload'
import { BadgeIcon as IdCard, GraduationCap, Briefcase, Camera, FileText } from 'lucide-react'
import { FormData } from '@/lib/types/form'

interface DocumentsStepProps {
  formData: FormData
  errors: any
  translations: any
  onChange: (data: Partial<FormData>) => void
  clientFolder: string
  clientFolderId?: string // ✅ AJOUTER L'ID DU DOSSIER
  onFolderCreated: (folderId: string) => void // ✅ CALLBACK POUR L'ID
}

export const DocumentsStep = ({
  formData,
  errors,
  translations: t,
  onChange,
  clientFolder,
  clientFolderId, // ✅ RECEVOIR L'ID DU DOSSIER
  onFolderCreated // ✅ CALLBACK POUR SAUVEGARDER L'ID
}: DocumentsStepProps) => {

  console.log('📁 DocumentsStep - Dossier client:', clientFolder)
  console.log('🆔 ID du dossier existant:', clientFolderId)

  const updateDocument = (field: keyof FormData['documents'], file: any) => {
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
          label={t.steps.documents.fields.id.label}
          field="id"
          icon={<IdCard className="w-5 h-5" />}
          file={formData.documents.id}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId} // ✅ PASSER L'ID DU DOSSIER
          onFolderCreated={onFolderCreated} // ✅ CALLBACK POUR L'ID
          onChange={(file) => updateDocument('id', file)}
        />

        <FileUpload
          label={t.steps.documents.fields.diploma.label}
          field="diploma"
          icon={<GraduationCap className="w-5 h-5" />}
          file={formData.documents.diploma}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId} // ✅ PASSER L'ID DU DOSSIER
          onFolderCreated={onFolderCreated} // ✅ CALLBACK POUR L'ID
          onChange={(file) => updateDocument('diploma', file)}
        />

        <FileUpload
          label={`${t.steps.documents.fields.workCertificate.label} (Optionnel)`}
          field="workCertificate"
          icon={<FileText className="w-5 h-5" />}
          file={formData.documents.workCertificate}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId} // ✅ PASSER L'ID DU DOSSIER
          onFolderCreated={onFolderCreated} // ✅ CALLBACK POUR L'ID
          onChange={(file) => updateDocument('workCertificate', file)}
        />

        <FileUpload
          label={t.steps.documents.fields.photo.label}
          field="photo"
          icon={<Camera className="w-5 h-5" />}
          file={formData.documents.photo}
          clientFolder={clientFolder}
          clientFolderId={clientFolderId} // ✅ PASSER L'ID DU DOSSIER
          onFolderCreated={onFolderCreated} // ✅ CALLBACK POUR L'ID
          onChange={(file) => updateDocument('photo', file)}
        />
      </div>
    </div>
  )
}