// lib/googleDriveService.ts
import { google } from 'googleapis'
import { Readable } from 'stream'

class GoogleDriveService {
    private static auth = new google.auth.GoogleAuth({
        credentials: {
            type: 'service_account',
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file'
        ]
    })

    private static async getDrive() {
        const authClient = await this.auth.getClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return google.drive({ version: 'v3', auth: authClient as any })
    }

    private static bufferToStream(buffer: Buffer): Readable {
        const readable = new Readable()
        readable.push(buffer)
        readable.push(null)
        return readable
    }

    static async uploadFile(
        file: Buffer,
        fileName: string,
        mimeType: string,
        clientFolder?: string,
        existingFolderId?: string // ✅ NOUVEAU PARAMÈTRE
    ) {
        console.log('🚀 Début upload Google Drive...')
        console.log('📁 Client Folder:', clientFolder)
        console.log('🆔 Existing Folder ID:', existingFolderId)

        try {
            const drive = await this.getDrive()
            console.log('✅ Connexion Google Drive établie')

            let folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || ''

            // ✅ UTILISER LE DOSSIER EXISTANT OU EN CRÉER UN NOUVEAU
            if (clientFolder) {
                if (existingFolderId) {
                    // ✅ UTILISER LE DOSSIER EXISTANT
                    console.log('📁 Utilisation du dossier existant:', existingFolderId)
                    folderId = existingFolderId
                } else {
                    // ✅ CRÉER OU RÉCUPÉRER LE DOSSIER CLIENT
                    console.log('📁 Création/récupération dossier client:', clientFolder)
                    folderId = await this.createOrGetFolder(clientFolder, folderId, drive)
                    console.log('📁 Dossier client ID:', folderId)
                }
            }

            const fileStream = this.bufferToStream(file)

            console.log('⬆️ Upload fichier vers le dossier...')
            const response = await drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: [folderId],
                },
                media: {
                    mimeType: mimeType,
                    body: fileStream,
                },
                fields: 'id,name,size,webViewLink,webContentLink',
                supportsAllDrives: true,
            })

            console.log('✅ Upload réussi! ID:', response.data.id)

            // Rendre le fichier public
            await drive.permissions.create({
                fileId: response.data.id!,
                requestBody: {
                    role: 'reader',
                    type: 'anyone',
                },
                supportsAllDrives: true,
            })

            return {
                id: response.data.id!,
                name: response.data.name || fileName,
                webViewLink: response.data.webViewLink || '',
                webContentLink: response.data.webContentLink || '',
                size: response.data.size || '0',
                folderId: folderId, // ✅ RETOURNER L'ID DU DOSSIER
            }
        } catch (error) {
            console.error('💥 Erreur upload Google Drive:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Erreur lors de l'upload vers Google Drive: ${errorMessage}`)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static async createOrGetFolder(folderName: string, parentId: string, drive: any) {
        try {
            // Rechercher si le dossier existe déjà
            const searchResponse = await drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and parents in '${parentId}' and trashed=false`,
                fields: 'files(id, name)',
                supportsAllDrives: true,
            })

            if (searchResponse.data.files && searchResponse.data.files.length > 0) {
                console.log('📁 Dossier existant trouvé:', searchResponse.data.files[0].id)
                return searchResponse.data.files[0].id!
            }

            // Créer le dossier s'il n'existe pas
            console.log('📁 Création nouveau dossier:', folderName)
            const createResponse = await drive.files.create({
                requestBody: {
                    name: folderName,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [parentId],
                },
                fields: 'id',
                supportsAllDrives: true,
            })

            console.log('✅ Dossier créé:', createResponse.data.id)
            return createResponse.data.id!
        } catch (error) {
            console.error('❌ Erreur création dossier:', error)
            return parentId // Fallback vers le dossier parent
        }
    }

    // ✅ NOUVELLE MÉTHODE : Générer nom de dossier unique
    static generateClientFolderName(firstName: string, lastName: string): string {
        const randomNumber = Math.floor(Math.random() * 100000)
        const cleanFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '')
        const cleanLastName = lastName.replace(/[^a-zA-Z0-9]/g, '')
        return `${cleanFirstName}-${cleanLastName}-${randomNumber}`
    }

    // ✅ AJOUTER CES MÉTHODES MANQUANTES :
    static getViewUrl(fileId: string): string {
        return `https://drive.google.com/file/d/${fileId}/view`
    }

    static getDirectDownloadUrl(fileId: string): string {
        return `https://drive.google.com/uc?export=download&id=${fileId}`
    }

    static async deleteFile(fileId: string) {
        try {
            const drive = await this.getDrive()

            await drive.files.delete({
                fileId: fileId,
                supportsAllDrives: true, // ✅ Important pour Shared Drives
            })

            console.log('🗑️ Fichier supprimé:', fileId)
            return true
        } catch (error) {
            console.error('❌ Erreur suppression fichier:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Erreur lors de la suppression: ${errorMessage}`)
        }
    }
}
// ✅ EXPORT THE WRAPPER FUNCTION for uploadToGoogleDrive
export async function uploadToGoogleDrive(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
) {
    const result = await GoogleDriveService.uploadFile(
        buffer,
        fileName,
        mimeType,
        undefined,
        folderId
    )

    return {
        success: true,
        fileId: result.id,
        url: result.webViewLink,
        downloadUrl: GoogleDriveService.getDirectDownloadUrl(result.id),
        folderId: result.folderId
    }
}
export { GoogleDriveService }