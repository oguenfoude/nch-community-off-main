import { NextRequest, NextResponse } from 'next/server'
import dbConnect from "@/lib/mongodb"
import Client from "@/models/Client"
import { requireAdmin } from '@/lib/auth'
import { GoogleDriveService } from '@/lib/googleDriveService'

// Limites et types autorisés
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'application/pdf'
]

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)
    await dbConnect()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Fichier et type de document requis' },
        { status: 400 }
      )
    }

    // Validation du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Formats acceptés: JPEG, JPG, PDF' },
        { status: 400 }
      )
    }

    // Trouver le client
    // const client = await Client.findById(params.id)
    // if (!client) {
    //   return NextResponse.json(
    //     { error: 'Client non trouvé' },
    //     { status: 404 }
    //   )
    // }

    // Convertir le fichier en Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // // Créer le nom du fichier
    // const fileExtension = file.type === 'application/pdf' ? 'pdf' : 'jpg'
    // const fileName = `${client.firstName}_${client.lastName}_${documentType}.${fileExtension}`

    // // Nom du dossier client
    // const clientFolderName = `${client.firstName}_${client.lastName}_${client._id}`

    // // Supprimer l'ancien fichier s'il existe
    // const existingDocument = client.documents?.[documentType as keyof typeof client.documents]
    // if (existingDocument) {
    //   try {
    //     // Extraire l'ID du fichier depuis l'URL Google Drive
    //     const fileIdMatch = existingDocument.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
    //     if (fileIdMatch) {
    //       await GoogleDriveService.deleteFile(fileIdMatch[1])
    //     }
    //   } catch (error) {
    //     console.error('Erreur suppression ancien fichier:', error)
    //     // Continuer même si la suppression échoue
    //   }
    // }

    // Upload vers Google Drive
    const uploadResult = await GoogleDriveService.uploadFile(
      buffer,
      "file",
      file.type,
    )

    // URL de visualisation Google Drive
    const documentUrl = GoogleDriveService.getViewUrl(uploadResult.id)

    // Mettre à jour le document dans la base de données
    const updateField = `documents.${documentType}`
    await Client.findByIdAndUpdate(
      params.id,
      {
        $set: { [updateField]: documentUrl }
      },
      { new: true }
    )

    return NextResponse.json({
      message: 'Document uploadé avec succès',
      url: documentUrl,
      downloadUrl: GoogleDriveService.getDirectDownloadUrl(uploadResult.id),
      fileInfo: {
        name: uploadResult.name,
        size: uploadResult.size,
        type: file.type
      }
    })

  } catch (error: any) {
    console.error('Erreur upload document:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin(request)
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')

    if (!documentType) {
      return NextResponse.json(
        { error: 'Type de document requis' },
        { status: 400 }
      )
    }

    const client = await Client.findById(params.id)
    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    const documentUrl = client.documents?.[documentType as keyof typeof client.documents]
    if (!documentUrl) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Extraire l'ID du fichier depuis l'URL Google Drive
    const fileIdMatch = documentUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
    if (fileIdMatch) {
      await GoogleDriveService.deleteFile(fileIdMatch[1])
    }

    // Supprimer de la base de données
    const updateField = `documents.${documentType}`
    await Client.findByIdAndUpdate(
      params.id,
      { $unset: { [updateField]: "" } },
      { new: true }
    )

    return NextResponse.json({
      message: 'Document supprimé avec succès'
    })

  } catch (error: any) {
    console.error('Erreur suppression document:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}