// lib/services/googleSheets.sync.ts
import { prisma } from '@/lib/prisma'
import { updateClientInSheet } from '@/lib/googleSheetsService'

/**
 * Sync client data to Google Sheets
 * This fetches FRESH data from database and syncs to Google Sheets
 * 
 * USE THIS AFTER:
 * - Admin updates client info
 * - Admin verifies/rejects payment
 * - Admin changes payment status
 * - Client info changes
 * 
 * @param clientId - The client's database ID
 * @returns Promise<boolean> - true if synced successfully
 */
export async function syncClientToGoogleSheets(clientId: string): Promise<boolean> {
    try {
        console.log('📊 Starting Google Sheets sync for client:', clientId)
        
        // 1. Fetch FRESH client data with all payments
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                payments: {
                    orderBy: { createdAt: 'asc' } // First payment first
                }
            }
        })

        if (!client) {
            console.warn('⚠️ Client not found for sync:', clientId)
            return false
        }

        // 2. Calculate payment information
        const payments = client.payments || []
        
        // Separate payments by type
        const firstPayment = payments.find(p => p.paymentType === 'initial')
        const secondPayment = payments.find(p => p.paymentType === 'second')
        
        // Calculate global payment status
        let globalPaymentStatus = 'Non payé'
        
        if (firstPayment?.status === 'verified' && secondPayment?.status === 'verified') {
            globalPaymentStatus = 'Payé 100%'
        } else if (firstPayment?.status === 'verified' && !secondPayment) {
            globalPaymentStatus = 'Payé 50%'
        } else if (firstPayment?.status === 'verified' && secondPayment?.status !== 'verified') {
            globalPaymentStatus = 'Payé 50%'
        } else if (firstPayment?.status === 'pending' || firstPayment?.status === 'paid') {
            globalPaymentStatus = 'En attente de vérification'
        } else if (firstPayment?.status === 'rejected') {
            globalPaymentStatus = 'Paiement rejeté'
        }

        // Get payment status labels for Google Sheets
        const getPaymentStatusLabel = (status: string) => {
            switch (status?.toLowerCase()) {
                case 'verified': return 'Vérifié'
                case 'completed': return 'Complété'
                case 'paid': return 'Soumis - En vérification'
                case 'pending': return 'En attente'
                case 'rejected': return 'Rejeté'
                case 'failed': return 'Échoué'
                default: return status || '-'
            }
        }

        // 3. Prepare update data
        const updateData: any = {
            // Client basic info (always update to keep in sync)
            firstName: client.firstName,
            lastName: client.lastName,
            phone: client.phone,
            wilaya: client.wilaya,
            diploma: client.diploma,
            selectedOffer: client.selectedOffer,
            selectedCountries: client.selectedCountries || [],
            
            // Documents (if exist)
            documents: client.documents || {},
        }

        // 4. Add FIRST payment info if exists
        if (firstPayment) {
            updateData.paymentMethod = firstPayment.paymentMethod
            updateData.paymentStatus = getPaymentStatusLabel(firstPayment.status)
            updateData.paymentType = 'Premier paiement'
            
            // Add receipt URL if available
            if (firstPayment.receiptUrl) {
                updateData.documents = {
                    ...updateData.documents,
                    paymentReceipt: firstPayment.receiptUrl
                }
            }
        }

        // 5. Add SECOND payment info if exists (this is important!)
        if (secondPayment) {
            // For second payment, we need to use the special format
            updateData.paymentType = '2ème paiement 50%'
            updateData.paymentStatus = getPaymentStatusLabel(secondPayment.status)
            updateData.paymentMethod = secondPayment.paymentMethod
            
            // Add second payment receipt
            if (secondPayment.receiptUrl) {
                updateData.documents = {
                    ...updateData.documents,
                    paymentReceipt: secondPayment.receiptUrl
                }
            }
        }

        // 6. Sync to Google Sheets
        const success = await updateClientInSheet(client.email, updateData)

        if (success) {
            console.log('✅ Google Sheets synced successfully for:', client.email)
        } else {
            console.warn('⚠️ Google Sheets sync returned false for:', client.email)
        }

        return success

    } catch (error: any) {
        console.error('❌ Google Sheets sync error:', error.message)
        // Don't throw - this is non-blocking
        return false
    }
}

/**
 * Sync payment verification to Google Sheets
 * Special function for payment verification (accept/reject)
 * 
 * @param clientId - The client's database ID
 * @param paymentId - The payment that was verified/rejected
 * @returns Promise<boolean> - true if synced successfully
 */
export async function syncPaymentVerificationToSheets(
    clientId: string, 
    paymentId: string
): Promise<boolean> {
    try {
        console.log('📊 Syncing payment verification:', paymentId)
        
        // Use the main sync function - it will fetch fresh data
        return await syncClientToGoogleSheets(clientId)
        
    } catch (error: any) {
        console.error('❌ Payment verification sync error:', error.message)
        return false
    }
}
