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
    }
    password?: string
    createdAt?: Date
}

// Helper to extract URL from document field and format as clickable HYPERLINK
function getDocumentUrl(doc: any): string {
    if (!doc) return ''
    
    let url = ''
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
    
    // Return as HYPERLINK formula for clickable link in Google Sheets
    // Escape double quotes in URL
    const escapedUrl = url.replace(/"/g, '""')
    return `=HYPERLINK("${escapedUrl}", "📄 Voir")`
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
 * Append a new client registration to Google Sheets
 */
export async function appendClientToSheet(data: ClientRegistrationData): Promise<boolean> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

    // Skip if Google Sheets is not configured (all 3 are required)
    if (!spreadsheetId || !email || !privateKey) {
        console.log('ℹ️ Google Sheets not configured, skipping. To enable, set all 3 env vars: GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY')
        return false
    }

    try {
        console.log('📊 Connecting to Google Sheets...')
        
        const auth = getServiceAccountAuth()
        const doc = new GoogleSpreadsheet(spreadsheetId, auth)
        
        await doc.loadInfo()
        console.log('✅ Connected to sheet:', doc.title)

        // Get the first sheet or create one
        let sheet = doc.sheetsByIndex[0]
        
        // Define headers
        const headers = [
            'Date',
            'Nom',
            'Prénom',
            'Email',
            'Téléphone',
            'Wilaya',
            'Diplôme',
            'Offre',
            'Pays Sélectionnés',
            'Méthode Paiement',
            'Type Paiement',
            'Statut Paiement',
            'BaridiMob Téléphone',
            'BaridiMob Reçu',
            'Mot de Passe',
            'Carte Identité',
            'Diplôme (doc)',
            'Certificat Travail',
            'Photo',
            'Reçu Paiement'
        ]
        
        if (!sheet) {
            // No sheet exists - create one with headers
            console.log('📝 Creating new sheet with headers...')
            sheet = await doc.addSheet({
                title: 'Clients',
                headerValues: headers
            })
        } else {
            // Sheet exists - check if headers are set
            try {
                await sheet.loadHeaderRow()
                
                // Check if first row is empty or has no headers
                if (!sheet.headerValues || sheet.headerValues.length === 0 || sheet.headerValues.every(h => !h)) {
                    console.log('📝 No headers found, adding headers...')
                    await sheet.setHeaderRow(headers)
                    // Reload headers after setting
                    await sheet.loadHeaderRow()
                }
            } catch (headerError: any) {
                // loadHeaderRow throws if row 1 is empty - set headers
                console.log('📝 Setting headers for empty sheet...')
                await sheet.setHeaderRow(headers)
                // Reload headers after setting
                await sheet.loadHeaderRow()
            }
        }
        
        console.log('✅ Headers ready:', sheet.headerValues?.length, 'columns')

        // Add new row with ALL data
        const newRow = await sheet.addRow({
            'Date': new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
            'Nom': data.lastName || '',
            'Prénom': data.firstName || '',
            'Email': data.email || '',
            'Téléphone': data.phone || '',
            'Wilaya': data.wilaya || '',
            'Diplôme': data.diploma || '',
            'Offre': data.selectedOffer || '',
            'Pays Sélectionnés': data.selectedCountries?.join(', ') || '',
            'Méthode Paiement': data.paymentMethod || '',
            'Type Paiement': data.paymentType || 'partial',
            'Statut Paiement': data.paymentStatus || 'pending',
            'BaridiMob Téléphone': data.baridiMobInfo?.phoneNumber || '',
            'BaridiMob Reçu': data.baridiMobInfo?.receiptNumber || '',
            'Mot de Passe': data.password || '',
            'Carte Identité': getDocumentUrl(data.documents?.id),
            'Diplôme (doc)': getDocumentUrl(data.documents?.diploma),
            'Certificat Travail': getDocumentUrl(data.documents?.workCertificate),
            'Photo': getDocumentUrl(data.documents?.photo),
            'Reçu Paiement': getDocumentUrl(data.documents?.paymentReceipt)
        })

        console.log('✅ Client added to Google Sheets, row:', newRow.rowNumber)
        return true

    } catch (error: any) {
        console.error('❌ Google Sheets error:', error.message)
        // Don't throw - we don't want to fail registration if Sheets fails
        return false
    }
}

/**
 * Update a client row in Google Sheets (by email)
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
        const auth = getServiceAccountAuth()
        const doc = new GoogleSpreadsheet(spreadsheetId, auth)
        
        await doc.loadInfo()
        const sheet = doc.sheetsByIndex[0]
        
        if (!sheet) {
            console.warn('⚠️ No sheet found')
            return false
        }

        const rows = await sheet.getRows()
        const clientRow = rows.find((row: GoogleSpreadsheetRow) => 
            row.get('Email')?.toLowerCase() === email.toLowerCase()
        )

        if (!clientRow) {
            console.warn('⚠️ Client not found in sheet:', email)
            return false
        }

        // Update fields
        if (updates.paymentStatus) clientRow.set('Statut Paiement', updates.paymentStatus)
        if (updates.documents?.id) clientRow.set('Carte Identité', getDocumentUrl(updates.documents.id))
        if (updates.documents?.diploma) clientRow.set('Diplôme (doc)', getDocumentUrl(updates.documents.diploma))
        if (updates.documents?.workCertificate) clientRow.set('Certificat Travail', getDocumentUrl(updates.documents.workCertificate))
        if (updates.documents?.photo) clientRow.set('Photo', getDocumentUrl(updates.documents.photo))
        if (updates.documents?.paymentReceipt) clientRow.set('Reçu Paiement', getDocumentUrl(updates.documents.paymentReceipt))

        await clientRow.save()
        console.log('✅ Client updated in Google Sheets')
        return true

    } catch (error: any) {
        console.error('❌ Google Sheets update error:', error.message)
        return false
    }
}

export type { ClientRegistrationData }
