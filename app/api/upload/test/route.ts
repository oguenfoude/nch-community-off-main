// app/api/upload/test/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { GoogleDriveService } from "@/lib/googleDriveService"

export async function POST(request: NextRequest) {
    try {
        console.log('🧪 Début du test d\'upload Google Drive...')

        const formData = await request.formData()
        const file = formData.get("file") as File
        const clientId = formData.get("clientId") as string
        const documentType = formData.get("documentType") as string

        // ✅ LOGS DÉTAILLÉS DU FICHIER
        console.log('📄 Fichier reçu:')
        console.log('  - Nom:', file.name)
        console.log('  - Taille:', file.size, 'bytes')
        console.log('  - Type MIME:', file.type)
        console.log('  - LastModified:', file.lastModified)

        // Validation des données
        if (!file) {
            console.log('❌ Aucun fichier fourni')
            return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
        }

        // ✅ VÉRIFICATION CRITIQUE : Fichier vide
        if (file.size === 0) {
            console.log('❌ PROBLÈME: Le fichier reçu est VIDE (0 bytes)')
            return NextResponse.json({ error: "Le fichier reçu est vide" }, { status: 400 })
        }

        if (!clientId) {
            console.log('❌ Client ID manquant')
            return NextResponse.json({ error: "Client ID requis" }, { status: 400 })
        }

        if (!documentType) {
            console.log('❌ Type de document manquant')
            return NextResponse.json({ error: "Type de document requis" }, { status: 400 })
        }

        console.log(`📁 Upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        console.log(`👤 Client: ${clientId}`)
        console.log(`📄 Type: ${documentType}`)

        // Validation du fichier
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            console.log('❌ Fichier trop volumineux')
            return NextResponse.json({
                error: "Fichier trop volumineux. Maximum: 10MB"
            }, { status: 400 })
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!allowedTypes.includes(file.type)) {
            console.log('❌ Type de fichier non autorisé:', file.type)
            return NextResponse.json({
                error: "Type de fichier non autorisé. Autorisés: PDF, JPG, PNG"
            }, { status: 400 })
        }

        // Convertir le fichier en Buffer
        console.log('🔄 Conversion du fichier en Buffer...')

        try {
            const bytes = await file.arrayBuffer()
            console.log('📦 ArrayBuffer créé, taille:', bytes.byteLength)

            const buffer = Buffer.from(bytes)
            console.log('📋 Buffer créé, taille:', buffer.length)
            console.log('🔍 Premiers 20 bytes du buffer:', buffer.slice(0, 20))

            // ✅ VÉRIFICATION CRITIQUE : Buffer vide
            if (buffer.length === 0) {
                console.log('❌ PROBLÈME: Le buffer créé est VIDE')
                return NextResponse.json({ error: "Erreur de conversion du fichier en buffer" }, { status: 400 })
            }

            // Vérifier que c'est bien un PDF (pour PDFs)
            if (file.type === 'application/pdf') {
                const pdfHeader = buffer.slice(0, 4).toString()
                console.log('📄 Header PDF:', pdfHeader)
                if (!pdfHeader.includes('%PDF')) {
                    console.log('⚠️ ATTENTION: Le fichier ne semble pas être un PDF valide')
                }
            }

            // Créer le nom du fichier avec timestamp
            const timestamp = Date.now()
            const fileExtension = file.type === 'application/pdf' ? 'pdf' :
                file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'jpg' : 'png'
            const fileName = `test_${documentType}_${timestamp}.${fileExtension}`

            console.log(`📝 Nom du fichier: ${fileName}`)

            // Test de la configuration Google Drive
            console.log('🔧 Vérification de la configuration Google Drive...')
            console.log('📧 Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configuré' : 'Non configuré')
            console.log('🔑 Private Key:', process.env.GOOGLE_PRIVATE_KEY ? 'Configuré' : 'Non configuré')
            console.log('📁 Folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID || 'Non configuré (création auto)')

            // Upload vers Google Drive
            console.log('☁️ Upload vers Google Drive...')
            console.log('📊 Résumé avant upload:')
            console.log('  - Buffer size:', buffer.length)
            console.log('  - File name:', fileName)
            console.log('  - MIME type:', file.type)

            const result = await GoogleDriveService.uploadFile(
                buffer,
                fileName,
                file.type,
                `test-${clientId}`
            )

            console.log('✅ Upload réussi!', result)

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
                    webViewLink: result.webViewLink,
                    webContentLink: result.webContentLink
                }
            }

            console.log('📤 Réponse envoyée:', response)

            return NextResponse.json(response)

        } catch (conversionError) {
            console.error('❌ Erreur lors de la conversion du fichier:', conversionError)
            return NextResponse.json({ error: "Erreur de traitement du fichier" }, { status: 500 })
        }

    } catch (error: any) {
        console.error("❌ Erreur d'upload:", error)

        // Log détaillé de l'erreur
        console.error("Stack trace:", error.stack)

        let errorMessage = "Erreur lors de l'upload"
        let statusCode = 500

        if (error.message.includes("File not found")) {
            errorMessage = "Dossier Google Drive non accessible. Vérifiez votre configuration."
            statusCode = 400
        } else if (error.message.includes("permission")) {
            errorMessage = "Permission refusée. Vérifiez les permissions Google Drive."
            statusCode = 403
        } else if (error.message.includes("quota")) {
            errorMessage = "Quota Google Drive dépassé."
            statusCode = 413
        } else if (error.message.includes("Invalid credentials")) {
            errorMessage = "Identifiants Google Drive invalides."
            statusCode = 401
        } else {
            errorMessage = error.message || "Erreur inconnue lors de l'upload"
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: statusCode }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        console.log('🗑️ Début du test de suppression Google Drive...')

        const { searchParams } = new URL(request.url)
        const fileId = searchParams.get('fileId')

        if (!fileId) {
            console.log('❌ File ID manquant')
            return NextResponse.json({ error: "File ID requis" }, { status: 400 })
        }

        console.log(`🗑️ Suppression du fichier: ${fileId}`)

        await GoogleDriveService.deleteFile(fileId)

        console.log('✅ Fichier supprimé avec succès')

        return NextResponse.json({ message: "Fichier supprimé avec succès" })

    } catch (error: any) {
        console.error("❌ Erreur de suppression:", error)

        let errorMessage = "Erreur lors de la suppression"

        if (error.message.includes("File not found")) {
            errorMessage = "Fichier non trouvé sur Google Drive."
        } else if (error.message.includes("permission")) {
            errorMessage = "Permission refusée pour supprimer le fichier."
        } else {
            errorMessage = error.message || "Erreur inconnue lors de la suppression"
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}