// lib/services/googleSheets.sync.ts
/**
 * 🔄 COMPREHENSIVE GOOGLE SHEETS SYNC SERVICE
 * 
 * This service provides real-time synchronization between MongoDB and Google Sheets
 * with complete change history tracking.
 * 
 * Features:
 * - Real-time sync on every update
 * - Separate change history sheet
 * - Non-blocking error handling
 * - Complete audit trail
 * - Fetches fresh data before each sync
 */

import { prisma } from '@/lib/prisma'
import { updateClientInSheet, type ClientRegistrationData } from '@/lib/googleSheetsService'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

// ============================================
// CHANGE HISTORY TRACKING
// ============================================

const HISTORY_HEADERS = [
    'Date/Heure',
    'Email Client',
    'Nom Complet',
    'Type de Changement',
    'Champ Modifié',
    'Ancienne Valeur',
    'Nouvelle Valeur',
    'Admin ID',
    'Détails'
]

interface ChangeHistoryEntry {
    email: string
    clientName: string
    changeType: 'payment_verification' | 'status_update' | 'client_update' | 'document_upload' | 'payment_status_change'
    fieldChanged: string
    oldValue?: string
    newValue: string
    adminId?: string
    details?: string
}

/**
 * Get authenticated JWT for Google Sheets API
 */
function getServiceAccountAuth(): JWT {
    const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

    if (!email || !privateKey) {
        throw new Error('Google Sheets credentials missing')
    }

    return new JWT({
        email,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
}

/**
 * Get or create the history sheet
 */
async function getOrCreateHistorySheet(doc: GoogleSpreadsheet) {
    let historySheet = doc.sheetsByTitle['Historique Modifications']
    
    if (!historySheet) {
        console.log('📝 Creating history sheet...')
        historySheet = await doc.addSheet({
            title: 'Historique Modifications',
            headerValues: HISTORY_HEADERS
        })
    } else {
        try {
            await historySheet.loadHeaderRow()
            if (!historySheet.headerValues || historySheet.headerValues.length === 0) {
                await historySheet.setHeaderRow(HISTORY_HEADERS)
                await historySheet.loadHeaderRow()
            }
        } catch (error) {
            await historySheet.setHeaderRow(HISTORY_HEADERS)
            await historySheet.loadHeaderRow()
        }
    }
    
    return historySheet
}

/**
 * Log a change to the history sheet
 */
export async function logChangeToHistory(entry: ChangeHistoryEntry): Promise<boolean> {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    const email = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

    if (!spreadsheetId || !email || !privateKey) {
        console.log('ℹ️ Google Sheets not configured, skipping history log')
        return false
    }

    try {
        const auth = getServiceAccountAuth()
        const doc = new GoogleSpreadsheet(spreadsheetId, auth)
        
        await doc.loadInfo()
        const historySheet = await getOrCreateHistorySheet(doc)
        
        const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' })
        
        // Add change entry
        await historySheet.addRow({
            'Date/Heure': now,
            'Email Client': entry.email,
            'Nom Complet': entry.clientName,
            'Type de Changement': entry.changeType,
            'Champ Modifié': entry.fieldChanged,
            'Ancienne Valeur': entry.oldValue || '',
            'Nouvelle Valeur': entry.newValue,
            'Admin ID': entry.adminId || 'System',
            'Détails': entry.details || ''
        })
        
        console.log('✅ Change logged to history sheet')
        return true
    } catch (error: any) {
        console.error('❌ History sheet logging error:', error.message)
        return false
    }
}

// ============================================
// CLIENT DATA SYNC
// ============================================

/**
 * Calculate payment status label for Google Sheets
 */
function calculatePaymentStatusLabel(payments: any[]): string {
    const verifiedPayments = payments.filter(p => p.status === 'verified' || p.status === 'completed')
    const totalVerified = verifiedPayments.reduce((sum, p) => sum + p.amount, 0)
    
    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'paid')
    const rejectedPayments = payments.filter(p => p.status === 'rejected')
    
    if (rejectedPayments.length > 0) {
        return 'Paiement Rejeté'
    }
    
    if (totalVerified === 0) {
        return 'Non payé'
    }
    
    // Check if this is full payment (around 27000-28000) or partial (around 14000)
    const isFullPayment = totalVerified >= 25000
    
    if (isFullPayment && pendingPayments.length === 0) {
        return 'Payé 100%'
    } else if (!isFullPayment && pendingPayments.length > 0) {
        return 'Payé 50% (En attente 2ème paiement)'
    } else if (!isFullPayment && pendingPayments.length === 0) {
        return 'Payé 50%'
    }
    
    return 'Payé 100%'
}

/**
 * Main sync function - Fetches fresh data from DB and syncs to Google Sheets
 * This is called after ANY update to client data
 */
export async function syncClientToGoogleSheets(
    clientId: string,
    changeInfo?: {
        changeType: ChangeHistoryEntry['changeType']
        fieldChanged: string
        oldValue?: string
        newValue: string
        adminId?: string
        details?: string
    }
): Promise<boolean> {
    try {
        console.log('📊 Syncing client to Google Sheets:', clientId)
        
        // 1. Fetch fresh client data with payments
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        
        if (!client) {
            console.warn('⚠️ Client not found:', clientId)
            return false
        }
        
        // 2. Calculate payment details
        const payments = client.payments || []
        const firstPayment = payments.find(p => p.paymentType === 'initial')
        const secondPayment = payments.find(p => p.paymentType === 'second')
        
        const verifiedPayments = payments.filter(p => p.status === 'verified' || p.status === 'completed')
        const totalPaid = verifiedPayments.reduce((sum, p) => sum + p.amount, 0)
        
        // 3. Prepare complete update data
        const updateData: Partial<ClientRegistrationData> = {
            firstName: client.firstName,
            lastName: client.lastName,
            email: client.email,
            phone: client.phone,
            wilaya: client.wilaya,
            diploma: client.diploma,
            selectedOffer: client.selectedOffer,
            selectedCountries: client.selectedCountries,
            documents: client.documents as any,
            paymentStatus: calculatePaymentStatusLabel(payments),
            createdAt: client.createdAt
        }
        
        // Add first payment info if exists
        if (firstPayment) {
            updateData.paymentMethod = firstPayment.paymentMethod
            updateData.baridiMobInfo = firstPayment.baridiMobInfo as any
            if (firstPayment.receiptUrl) {
                updateData.documents = {
                    ...updateData.documents as any,
                    paymentReceipt: firstPayment.receiptUrl
                }
            }
        }
        
        // Add second payment info if exists
        if (secondPayment) {
            updateData.paymentType = '2ème paiement 50%'
            if (secondPayment.receiptUrl) {
                updateData.documents = {
                    ...updateData.documents as any,
                    paymentReceipt: secondPayment.receiptUrl
                }
            }
        }
        
        // 4. Sync to main Google Sheets
        const syncSuccess = await updateClientInSheet(client.email, updateData)
        
        // 5. Log change to history sheet if change info provided
        if (syncSuccess && changeInfo) {
            await logChangeToHistory({
                email: client.email,
                clientName: `${client.firstName} ${client.lastName}`,
                changeType: changeInfo.changeType,
                fieldChanged: changeInfo.fieldChanged,
                oldValue: changeInfo.oldValue,
                newValue: changeInfo.newValue,
                adminId: changeInfo.adminId,
                details: changeInfo.details
            })
        }
        
        console.log('✅ Client synced successfully to Google Sheets')
        return true
        
    } catch (error: any) {
        console.error('❌ Google Sheets sync error:', error.message)
        // Non-blocking - don't throw, just log
        return false
    }
}

/**
 * Batch sync multiple clients (useful for bulk operations)
 */
export async function syncMultipleClientsToGoogleSheets(
    clientIds: string[]
): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0
    
    console.log(`📊 Batch syncing ${clientIds.length} clients to Google Sheets...`)
    
    for (const clientId of clientIds) {
        const result = await syncClientToGoogleSheets(clientId)
        if (result) {
            success++
        } else {
            failed++
        }
        
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`✅ Batch sync complete: ${success} success, ${failed} failed`)
    return { success, failed }
}

/**
 * Sync payment verification to sheets with detailed history
 */
export async function syncPaymentVerification(
    clientId: string,
    paymentId: string,
    action: 'accept' | 'reject',
    adminId: string,
    reason?: string
): Promise<boolean> {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
    })
    
    if (!payment) return false
    
    const changeInfo = {
        changeType: 'payment_verification' as const,
        fieldChanged: `Paiement ${payment.paymentType === 'initial' ? '1er' : '2ème'}`,
        oldValue: payment.status,
        newValue: action === 'accept' ? 'verified' : 'rejected',
        adminId,
        details: reason || `Paiement ${action === 'accept' ? 'accepté' : 'rejeté'} par admin (${payment.amount} DZD)`
    }
    
    return await syncClientToGoogleSheets(clientId, changeInfo)
}

/**
 * Sync document upload to sheets with history
 */
export async function syncDocumentUpload(
    clientEmail: string,
    documentType: string,
    documentUrl: string
): Promise<boolean> {
    const client = await prisma.client.findUnique({
        where: { email: clientEmail }
    })
    
    if (!client) return false
    
    const changeInfo = {
        changeType: 'document_upload' as const,
        fieldChanged: documentType,
        newValue: documentUrl,
        details: `Document ${documentType} téléchargé`
    }
    
    return await syncClientToGoogleSheets(client.id, changeInfo)
}

/**
 * Sync status change to sheets with history
 */
export async function syncStatusChange(
    clientId: string,
    oldStatus: string,
    newStatus: string,
    adminId: string
): Promise<boolean> {
    const changeInfo = {
        changeType: 'status_update' as const,
        fieldChanged: 'Status Client',
        oldValue: oldStatus,
        newValue: newStatus,
        adminId,
        details: `Statut changé de "${oldStatus}" à "${newStatus}"`
    }
    
    return await syncClientToGoogleSheets(clientId, changeInfo)
}

/**
 * Sync client info update to sheets with history
 */
export async function syncClientUpdate(
    clientId: string,
    updatedFields: string[],
    adminId: string
): Promise<boolean> {
    const changeInfo = {
        changeType: 'client_update' as const,
        fieldChanged: updatedFields.join(', '),
        newValue: 'Updated',
        adminId,
        details: `Champs mis à jour: ${updatedFields.join(', ')}`
    }
    
    return await syncClientToGoogleSheets(clientId, changeInfo)
}
