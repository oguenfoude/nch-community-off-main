// lib/googleSheetsService.ts
import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

interface ClientRegistrationData {
    firstName: string
    lastName: string
    email: string
    phone: string
    wilaya: string
    diploma: string
    selectedOffer: string
    selectedCountries?: string[]
    paymentMethod: string
    paymentStatus: string
    paymentType?: string
    baridiMobInfo?: {
        phoneNumber?: string
        receiptNumber?: string
    } | null
    documents?: {
        id?: { url?: string } | string | null
        diploma?: { url?: string } | string | null
        workCertificate?: { url?: string } | string | null
        photo?: { url?: string } | string | null
        paymentReceipt?: { url?: string } | string | null
        guarantee?: { url?: string; fileId?: string; name?: string; type?: string } | null
    }
    password?: string
    createdAt?: Date
}

// ============================================
// SHEET HEADERS - Professional Structure
// ============================================
const SHEET_HEADERS = [
    // Client Info
    'Date Inscription',
    'Nom',
    'Prénom', 
    'Email',
    'Téléphone',
    'Wilaya',
    'Diplôme',
    'Offre',
    'Pays Sélectionnés',
    
    // Payment Info
    'Premier Paiement (50%)',
    'Date 1er Paiement',
    'Méthode 1er Paiement',
    'Statut 1er Paiement',
    'Reçu 1er Paiement',
    
    'Deuxième Paiement (50%)',
    'Date 2ème Paiement',
    'Méthode 2ème Paiement',
    'Statut 2ème Paiement',
    'Reçu 2ème Paiement',
    
    'Statut Paiement Global',
    
    // Documents
    'Carte Identité',
    'Diplôme (doc)',
    'Certificat Travail',
    'Photo',
    
    // Guarantee Document
    'Document Garantie',
    
    // System
    'Mot de Passe',
    'Dernière Mise à Jour'
]

// Helper to extract URL from document field and format as clickable HYPERLINK
function getDocumentUrl(doc: any): string {
    if (!doc) return ''
    
    let url = ''
    let fileType = 'file'
    
    if (typeof doc === 'string') {
        url = doc
    } else if (doc.url) {
        url = doc.url
    } else if (doc.secureUrl) {
        url = doc.secureUrl
    } else if (doc.downloadUrl) {
        url = doc.downloadUrl
    }
    
    // Ensure HTTPS for Cloudinary URLs
    if (url && url.startsWith('http://')) {
        url = url.replace('http://', 'https://')
    }
    
    if (!url) return ''
    
    // Detect file type from URL or doc object
    const isPdf = (doc.type && doc.type.includes('pdf')) || 
                  url.includes('/raw/') || 
                  url.toLowerCase().includes('.pdf')
    
    if (isPdf) {
        fileType = 'PDF'
    } else if ((doc.type && doc.type.includes('image')) || url.includes('/image/')) {
        fileType = 'IMG'
    }
    
    // For PDFs, use Google Docs Viewer for preview instead of direct download
    let linkUrl = url
    if (isPdf) {
        linkUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
    }
    
    // Return as HYPERLINK formula for clickable link in Google Sheets
    // Show file type icon for clarity
    const escapedUrl = linkUrl.replace(/"/g, '""')
    const icon = fileType === 'PDF' ? '📄' : fileType === 'IMG' ? '🖼️' : '📎'
    return `=HYPERLINK("${escapedUrl}", "${icon} ${fileType}")`
}

/**
 * Get authenticated JWT for Google Sheets API
 */
function getServiceAccountAuth(): JWT {
    const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

    if (!email || !privateKey) {
        throw new Error(
            'Google Sheets credentials missing. Set GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY'
        )
    }

    return new JWT({
        email,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
}

/**
 * Get or create the main sheet with proper headers
 */
async function getOrCreateSheet(doc: GoogleSpreadsheet) {
    let sheet = doc.sheetsByIndex[0]
    
    if (!sheet) {
        // No sheet exists - create one with headers
        console.log('📝 Creating new sheet with headers...')
        sheet = await doc.addSheet({
            title: 'Clients NCH Community',
            headerValues: SHEET_HEADERS
        })
    } else {
        // Sheet exists - check if headers are set
        try {
            await sheet.loadHeaderRow()
            
            // Check if first row is empty or has no headers
            if (!sheet.headerValues || sheet.headerValues.length === 0 || sheet.headerValues.every(h => !h)) {
                console.log('📝 No headers found, adding headers...')
                await sheet.setHeaderRow(SHEET_HEADERS)
                await sheet.loadHeaderRow()
            }
        } catch (headerError: any) {
            // loadHeaderRow throws if row 1 is empty - set headers
            console.log('📝 Setting headers for empty sheet...')
            await sheet.setHeaderRow(SHEET_HEADERS)
            await sheet.loadHeaderRow()
        }
    }
    
    console.log('✅ Headers ready:', sheet.headerValues?.length, 'columns')
    return sheet
}

/**
 * Find client row by email
 */
async function findClientRow(sheet: any, email: string): Promise<GoogleSpreadsheetRow | null> {
    const rows = await sheet.getRows()
    return rows.find((row: GoogleSpreadsheetRow) => 
        row.get('Email')?.toLowerCase() === email.toLowerCase()
    ) || null
}

/**
 * Append NEW client to Google Sheets (First Registration Only)
 * This creates a new row for the client
 */
export async function appendClientToSheet(data: ClientRegistrationData): Promise<boolean> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

    // Skip if Google Sheets is not configured
    if (!spreadsheetId || !email || !privateKey) {
        console.log('ℹ️ Google Sheets not configured, skipping')
        return false
    }

    try {
        console.log('📊 Connecting to Google Sheets...')
        
        const auth = getServiceAccountAuth()
        const doc = new GoogleSpreadsheet(spreadsheetId, auth)
        
        await doc.loadInfo()
        console.log('✅ Connected to sheet:', doc.title)

        const sheet = await getOrCreateSheet(doc)
        
        // Check if client already exists
        const existingRow = await findClientRow(sheet, data.email)
        if (existingRow) {
            console.log('⚠️ Client already exists, use updateClientInSheet instead')
            return await updateClientInSheet(data.email, data)
        }

        // Calculate payment amount based on offer
        const offerPrices: Record<string, number> = {
            'basic': 21000,
            'premium': 28000,
            'gold': 35000
        }
        const totalPrice = offerPrices[data.selectedOffer?.toLowerCase()] || 0
        const firstPaymentAmount = data.paymentType === 'full' ? totalPrice : Math.floor(totalPrice / 2)

        // Add new row with ALL data
        const newRow = await sheet.addRow({
            // Client Info
            'Date Inscription': new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
            'Nom': data.lastName || '',
            'Prénom': data.firstName || '',
            'Email': data.email || '',
            'Téléphone': data.phone || '',
            'Wilaya': data.wilaya || '',
            'Diplôme': data.diploma || '',
            'Offre': data.selectedOffer || '',
            'Pays Sélectionnés': data.selectedCountries?.join(', ') || '',
            
            // First Payment
            'Premier Paiement (50%)': `${firstPaymentAmount} DZD`,
            'Date 1er Paiement': new Date().toLocaleDateString('fr-FR'),
            'Méthode 1er Paiement': data.paymentMethod === 'cib' ? 'Carte CIB' : 'CCP/BaridiMob',
            'Statut 1er Paiement': data.paymentStatus || 'En attente',
            'Reçu 1er Paiement': data.documents?.paymentReceipt ? getDocumentUrl(data.documents.paymentReceipt) : '',
            
            // Second Payment (empty initially)
            'Deuxième Paiement (50%)': '',
            'Date 2ème Paiement': '',
            'Méthode 2ème Paiement': '',
            'Statut 2ème Paiement': '',
            'Reçu 2ème Paiement': '',
            
            // Global Status
            'Statut Paiement Global': data.paymentType === 'full' ? 'Payé 100%' : 'Payé 50%',
            
            // Documents
            'Carte Identité': getDocumentUrl(data.documents?.id),
            'Diplôme (doc)': getDocumentUrl(data.documents?.diploma),
            'Certificat Travail': getDocumentUrl(data.documents?.workCertificate),
            'Photo': getDocumentUrl(data.documents?.photo),
            
            // Guarantee Document (empty initially)
            'Document Garantie': '',
            
            // System
            'Mot de Passe': data.password || '',
            'Dernière Mise à Jour': new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })
        })

        console.log('✅ Client added to Google Sheets, row:', newRow.rowNumber)
        return true

    } catch (error: any) {
        console.error('❌ Google Sheets error:', error.message)
        return false
    }
}

/**
 * Update EXISTING client in Google Sheets (Updates by Email)
 * Use this for:
 * - Second payment updates
 * - Document uploads
 * - Status changes
 */
export async function updateClientInSheet(
    email: string,
    updates: Partial<ClientRegistrationData>
): Promise<boolean> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!spreadsheetId) {
        console.warn('⚠️ GOOGLE_SHEETS_SPREADSHEET_ID not set')
        return false
    }

    try {
        console.log('📊 Updating client in Google Sheets:', email)
        
        const auth = getServiceAccountAuth()
        const doc = new GoogleSpreadsheet(spreadsheetId, auth)
        
        await doc.loadInfo()
        const sheet = await getOrCreateSheet(doc)
        
        const clientRow = await findClientRow(sheet, email)

        if (!clientRow) {
            console.warn('⚠️ Client not found in sheet:', email)
            return false
        }

        // Update payment status
        if (updates.paymentStatus) {
            if (updates.paymentType === '2ème paiement 50%') {
                // Second payment update
                const offerPrices: Record<string, number> = {
                    'basic': 21000,
                    'premium': 28000,
                    'gold': 35000
                }
                const offer = clientRow.get('Offre')?.toLowerCase()
                const totalPrice = offerPrices[offer] || 0
                const secondPaymentAmount = Math.floor(totalPrice / 2)
                
                clientRow.set('Deuxième Paiement (50%)', `${secondPaymentAmount} DZD`)
                clientRow.set('Date 2ème Paiement', new Date().toLocaleDateString('fr-FR'))
                clientRow.set('Statut 2ème Paiement', updates.paymentStatus)
                clientRow.set('Statut Paiement Global', 'Payé 100%')
                
                // Set method if provided
                const paymentMethod = updates.paymentMethod || 'N/A'
                clientRow.set('Méthode 2ème Paiement', paymentMethod === 'cib' ? 'Carte CIB' : 'CCP/BaridiMob')
            } else {
                // First payment status update
                clientRow.set('Statut 1er Paiement', updates.paymentStatus)
            }
        }

        // Update documents
        if (updates.documents?.id) clientRow.set('Carte Identité', getDocumentUrl(updates.documents.id))
        if (updates.documents?.diploma) clientRow.set('Diplôme (doc)', getDocumentUrl(updates.documents.diploma))
        if (updates.documents?.workCertificate) clientRow.set('Certificat Travail', getDocumentUrl(updates.documents.workCertificate))
        if (updates.documents?.photo) clientRow.set('Photo', getDocumentUrl(updates.documents.photo))
        if (updates.documents?.paymentReceipt) {
            if (updates.paymentType === '2ème paiement 50%') {
                clientRow.set('Reçu 2ème Paiement', getDocumentUrl(updates.documents.paymentReceipt))
            } else {
                clientRow.set('Reçu 1er Paiement', getDocumentUrl(updates.documents.paymentReceipt))
            }
        }
        
        // Update guarantee document
        if ((updates.documents as any)?.guarantee) {
            const guaranteeDoc = (updates.documents as any).guarantee
            if (guaranteeDoc.url) {
                clientRow.set('Document Garantie', getDocumentUrl(guaranteeDoc))
            }
        }

        // Update timestamp
        clientRow.set('Dernière Mise à Jour', new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }))

        await clientRow.save()
        console.log('✅ Client updated in Google Sheets')
        return true

    } catch (error: any) {
        console.error('❌ Google Sheets update error:', error.message)
        return false
    }
}

export type { ClientRegistrationData }
