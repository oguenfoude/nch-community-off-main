// Utilitaires côté client pour les dossiers
export const generateClientFolderName = (firstName: string, lastName: string): string => {
    const randomNumber = Math.floor(Math.random() * 100000)
    const cleanFirstName = firstName.replace(/[^a-zA-Z0-9]/g, '')
    const cleanLastName = lastName.replace(/[^a-zA-Z0-9]/g, '')
    return `${cleanFirstName}-${cleanLastName}-${randomNumber}`
}

export const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
}

export const generateTemporaryClientId = (): string => {
    const timestamp = Date.now()
    const randomId = Math.floor(Math.random() * 10000)
    return `client-${timestamp}-${randomId}`
}