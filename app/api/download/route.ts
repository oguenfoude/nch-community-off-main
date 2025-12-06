import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileUrl = searchParams.get('url')
        const filename = searchParams.get('filename') || 'document'

        if (!fileUrl) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
        }

        console.log('🔽 Téléchargement via API:', { fileUrl, filename })

        // For Cloudinary URLs, we can redirect directly
        // Cloudinary URLs are already publicly accessible
        try {
            const response = await fetch(fileUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; NCH-Community/1.0)',
                },
            })

            if (!response.ok) {
                throw new Error(`Erreur téléchargement: ${response.status}`)
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

        } catch (downloadError) {
            console.error('❌ Erreur téléchargement:', downloadError)
            
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