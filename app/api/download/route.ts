import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/googleDriveService'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get('url')
        const filename = searchParams.get('filename') || 'document'

        if (!fileUrl) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
        }

        console.log('🔽 Téléchargement via API:', { fileUrl, filename })

        // Vérifier si c'est un fichier Google Drive
        const fileIdMatch = fileUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
        if (!fileIdMatch) {
            return NextResponse.json({ error: 'URL Google Drive invalide' }, { status: 400 })
        }

        const fileId = fileIdMatch[1]
        
        // ✅ NOUVEAU : Utiliser le service Google Drive pour télécharger
        try {
            // Créer l'URL de téléchargement direct
            const directDownloadUrl = GoogleDriveService.getDirectDownloadUrl(fileId)
            
            // Faire la requête vers Google Drive
            const response = await fetch(directDownloadUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; NCH-Community/1.0)',
                },
            })

            if (!response.ok) {
                throw new Error(`Erreur Google Drive: ${response.status}`)
            }

            // Obtenir le type de contenu
            const contentType = response.headers.get('content-type') || 'application/octet-stream'
            const contentLength = response.headers.get('content-length')
            
            // Déterminer l'extension basée sur le type de contenu
            let fileExtension = 'bin'
            if (contentType.includes('pdf')) {
                fileExtension = 'pdf'
            } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                fileExtension = 'jpg'
            } else if (contentType.includes('png')) {
                fileExtension = 'png'
            }

            const finalFilename = filename.includes('.') ? filename : `${filename}.${fileExtension}`

            console.log('✅ Téléchargement réussi:', { 
                contentType, 
                contentLength: contentLength || 'unknown',
                finalFilename 
            })

            // Retourner le fichier avec les bons headers
            return new NextResponse(response.body, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="${finalFilename}"`,
                    'Content-Length': contentLength || '',
                    'Cache-Control': 'no-cache',
                    'Access-Control-Allow-Origin': '*',
                },
            })

        } catch (driveError) {
            console.error('❌ Erreur Google Drive:', driveError)
            
            // Fallback: redirection vers l'URL originale
            return NextResponse.redirect(fileUrl)
        }

    } catch (error: any) {
        console.error('❌ Erreur téléchargement API:', error)
        return NextResponse.json(
            { error: 'Erreur lors du téléchargement' },
            { status: 500 }
        )
    }
}