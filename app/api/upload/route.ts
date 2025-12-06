// app/api/upload/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { GoogleDriveService } from "@/lib/googleDriveService"

export async function POST(request: NextRequest) {
  try {
    console.log('📁 Début upload - Route API principale')

    const formData = await request.formData()
    const file = formData.get("file") as File
    const clientId = formData.get("clientId") as string
    const documentType = formData.get("documentType") as string
    const existingFolderId = formData.get("existingFolderId") as string // ✅ NOUVEAU

    console.log('📋 Données reçues:')
    console.log('  - Client ID:', clientId)
    console.log('  - Document Type:', documentType)
    console.log('  - Fichier:', file.name, '(', file.size, 'bytes )')
    console.log('  - ID dossier existant:', existingFolderId) // ✅ LOG

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    if (!documentType) {
      return NextResponse.json({ error: "Document type required" }, { status: 400 })
    }

    // Validation taille fichier
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Validation types autorisés
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 })
    }

    // Convertir le fichier en Buffer
    console.log('🔄 Conversion en Buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 })
    }

    // Créer le nom du fichier avec le type de document
    const fileExtension = file.type === 'application/pdf' ? 'pdf' :
      file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'jpg' : 'png'
    const fileName = `${documentType}_${Date.now()}.${fileExtension}`

    console.log('📝 Nom du fichier généré:', fileName)

    // Upload vers Google Drive
    console.log('☁️ Upload vers Google Drive...')
    const result = await GoogleDriveService.uploadFile(
      buffer,
      fileName,
      file.type,
      clientId, // Nom du dossier client
      existingFolderId // ✅ PASSER L'ID DU DOSSIER EXISTANT
    )

    console.log('✅ Upload terminé avec succès!')

    const response = {
      url: GoogleDriveService.getViewUrl(result.id),
      publicId: result.id,
      downloadUrl: GoogleDriveService.getDirectDownloadUrl(result.id),
      fileInfo: {
        name: result.name,
        size: result.size,
        type: file.type,
        originalName: file.name
      },
      driveInfo: {
        folderId: result.folderId, // ✅ RETOURNER L'ID DU DOSSIER
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink
      }
    }

    console.log('📤 Réponse envoyée:', response)
    return NextResponse.json(response)

  } catch (error: any) {
    console.error("❌ Erreur upload:", error)
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    )
  }
}

// Route pour supprimer un fichier
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Début suppression fichier')

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    console.log('📋 File ID à supprimer:', fileId)

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 })
    }

    await GoogleDriveService.deleteFile(fileId)

    console.log('✅ Fichier supprimé avec succès')

    return NextResponse.json({ message: "File deleted successfully" })

  } catch (error: any) {
    console.error("❌ Erreur suppression:", error)
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    )
  }
}