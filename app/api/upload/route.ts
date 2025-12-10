  // app/api/upload/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { uploadToCloudinary, deleteFromCloudinary, generateClientFolderName } from "@/lib/cloudinaryService"
import { syncDocumentUpload } from "@/lib/services/googleSheets.sync"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const clientId = formData.get("clientId") as string | null
    const documentType = formData.get("documentType") as string | null
    const folder = formData.get("folder") as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validation taille fichier
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large (max 10MB)" }, { status: 400 })
    }

    // Validation types autorisés
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: "File type not allowed" }, { status: 400 })
    }

    // Convertir le fichier en Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    if (buffer.length === 0) {
      return NextResponse.json({ success: false, error: "Empty file" }, { status: 400 })
    }

    // Créer le nom du fichier
    const fileExtension = file.type === 'application/pdf' ? 'pdf' :
      file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'jpg' : 'png'
    const timestamp = Date.now()
    const fileName = documentType 
      ? `${documentType}_${timestamp}.${fileExtension}`
      : `upload_${timestamp}.${fileExtension}`

    // Déterminer le dossier et le type de ressource
    const resourceType = file.type === 'application/pdf' ? 'raw' : 'image'
    const uploadFolder = folder || (clientId ? `nch-community/${clientId}` : 'nch-community/receipts')

    // Upload vers Cloudinary
    const result = await uploadToCloudinary(buffer, fileName, {
      folder: uploadFolder,
      resourceType: resourceType as 'image' | 'raw',
      publicId: documentType ? `${documentType}_${timestamp}` : `upload_${timestamp}`
    })

    // Ensure we use secure URLs (HTTPS)
    const secureUrl = result.secureUrl || result.url.replace('http://', 'https://')
    
    // ✅ For PDFs: Create a preview URL using Google Docs Viewer
    // For images: Use the Cloudinary URL directly
    let previewUrl = secureUrl
    if (file.type === 'application/pdf') {
      // Google Docs Viewer can preview PDFs from public URLs
      previewUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=true`
    }

    const response = {
      success: true,
      url: secureUrl,
      publicId: result.publicId,
      downloadUrl: secureUrl,
      previewUrl: previewUrl,
      isPdf: file.type === 'application/pdf',
      fileInfo: {
        name: result.originalFilename,
        size: result.size,
        type: file.type,
        originalName: file.name,
        format: result.format
      },
      cloudinaryInfo: {
        folder: result.folder,
        publicId: result.publicId
      }
    }

    // 🔄 Sync document upload to Google Sheets if clientId provided
    if (clientId && documentType) {
      try {
        const client = await prisma.client.findUnique({ where: { id: clientId } })
        if (client) {
          await syncDocumentUpload(client.email, documentType, secureUrl)
        }
      } catch (error: any) {
        console.error('⚠️ Google Sheets sync failed:', error.message)
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error("❌ Erreur upload:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Upload failed" },
      { status: 500 }
    )
  }
}

// Route pour supprimer un fichier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicId = searchParams.get('publicId') || searchParams.get('fileId')

    if (!publicId) {
      return NextResponse.json({ error: "Public ID required" }, { status: 400 })
    }

    await deleteFromCloudinary(publicId)

    return NextResponse.json({ message: "File deleted successfully" })

  } catch (error: any) {
    console.error("❌ Erreur suppression:", error)
    return NextResponse.json(
      { error: error.message || "Delete failed" },
      { status: 500 }
    )
  }
}