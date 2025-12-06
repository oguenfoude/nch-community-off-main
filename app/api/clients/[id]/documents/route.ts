import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { requireAdmin } from '@/lib/auth'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinaryService'

// Limites et types autorisés
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'application/pdf'
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    
    // ✅ Attendre les params (Next.js 15)
    const { id } = await params

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

    // Upload vers Cloudinary
    const uploadResult = await uploadToCloudinary(
      buffer,
      `client_${id}_${documentType}`,
      {
        folder: `nch-community/clients/${id}`,
        resourceType: file.type === 'application/pdf' ? 'raw' : 'image'
      }
    )

    // Mettre à jour le document dans la base de données
    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    const currentDocuments = (client.documents as any) || {}
    const updatedDocuments = {
      ...currentDocuments,
      [documentType]: {
        publicId: uploadResult.publicId,
        url: uploadResult.url,
        format: uploadResult.format,
        size: uploadResult.size
      }
    }

    await prisma.client.update({
      where: { id },
      data: { documents: updatedDocuments }
    })

    return NextResponse.json({
      message: 'Document uploadé avec succès',
      url: uploadResult.url,
      fileInfo: {
        publicId: uploadResult.publicId,
        size: uploadResult.size,
        format: uploadResult.format
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)
    
    // ✅ Attendre les params (Next.js 15)
    const { id } = await params

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')

    if (!documentType) {
      return NextResponse.json(
        { error: 'Type de document requis' },
        { status: 400 }
      )
    }

    const client = await prisma.client.findUnique({
      where: { id }
    })
    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    const documents = (client.documents as any) || {}
    const documentData = documents[documentType]
    if (!documentData) {
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer de Cloudinary
    if (documentData.publicId) {
      await deleteFromCloudinary(documentData.publicId)
    }

    // Supprimer de la base de données
    const updatedDocuments = { ...documents }
    delete updatedDocuments[documentType]

    await prisma.client.update({
      where: { id },
      data: { documents: updatedDocuments }
    })

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