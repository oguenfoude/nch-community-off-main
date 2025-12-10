import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { updateClientInSheet } from '@/lib/googleSheetsService'

export async function POST(request: NextRequest) {
    try {
        // Verify client is authenticated
        const session = await auth()
        if (!session || session.user.userType !== 'client') {
            return NextResponse.json({
                success: false,
                error: 'Non authentifié'
            }, { status: 401 })
        }

        const body = await request.json()
        const { clientId, amount, paymentMethod, receiptUrl } = body

        console.log('📱 Second payment submission:', { clientId, amount, paymentMethod })

        // Verify this is the logged-in client
        if (clientId !== session.user.id) {
            return NextResponse.json({
                success: false,
                error: 'Non autorisé'
            }, { status: 403 })
        }

        // Get client
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: { payments: true }
        })

        if (!client) {
            return NextResponse.json({
                success: false,
                error: 'Client non trouvé'
            }, { status: 404 })
        }

        // Verify first payment exists and is verified
        console.log('📋 Checking payments:', client.payments?.map(p => ({ 
            type: p.paymentType, 
            status: p.status 
        })))
        
        const hasVerifiedFirstPayment = client.payments?.some(
            p => p.paymentType === 'initial' && (p.status === 'paid' || p.status === 'verified' || p.status === 'completed')
        )

        if (!hasVerifiedFirstPayment) {
            console.log('❌ First payment not found or not paid/verified')
            return NextResponse.json({
                success: false,
                error: 'Le premier paiement (50%) doit être effectué et vérifié avant de procéder au deuxième paiement'
            }, { status: 400 })
        }

        // Check if second payment already exists
        const existingSecondPayment = client.payments?.find(p => p.paymentType === 'second')
        
        if (existingSecondPayment) {
            console.log('⚠️ Second payment already exists, updating...')
            
            // Update existing second payment
            const updatedPayment = await prisma.payment.update({
                where: { id: existingSecondPayment.id },
                data: {
                    paymentMethod: paymentMethod,
                    amount: parseFloat(amount),
                    status: 'pending', // BaridiMob starts as pending, admin verifies it
                    receiptUrl: receiptUrl || existingSecondPayment.receiptUrl,
                    baridiMobInfo: paymentMethod === 'baridimob' ? {
                        email: 'contact@nch-community.online',
                        rip: '00799999004145522768',
                        ccp: '0041455227',
                        key: '68'
                    } : existingSecondPayment.baridiMobInfo
                }
            })

            console.log('✅ Second payment updated:', updatedPayment.id)

            // Update Google Sheets
            try {
                await updateClientInSheet(client.email, {
                    paymentStatus: paymentMethod === 'baridimob' ? 'En attente de vérification (2ème paiement)' : 'En attente (2ème paiement)',
                    paymentType: '2ème paiement 50%',
                    documents: {
                        paymentReceipt: receiptUrl || ''
                    }
                })
                console.log('✅ Google Sheets updated with second payment')
            } catch (error) {
                console.error('⚠️ Google Sheets sync failed:', error)
            }

            return NextResponse.json({
                success: true,
                message: paymentMethod === 'baridimob' 
                    ? 'Paiement mis à jour avec succès. En attente de vérification (24-48h).'
                    : 'Paiement mis à jour avec succès.',
                paymentId: updatedPayment.id
            })
        }

        // Create second payment record
        const payment = await prisma.payment.create({
            data: {
                clientId: client.id,
                paymentType: 'second',
                paymentMethod: paymentMethod,
                amount: parseFloat(amount),
                status: 'pending', // All payments start as pending, admin verifies
                receiptUrl: receiptUrl || null,
                baridiMobInfo: paymentMethod === 'baridimob' ? {
                    email: 'contact@nch-community.online',
                    rip: '00799999004145522768',
                    ccp: '0041455227',
                    key: '68'
                } : null
            }
        })

        console.log('✅ Second payment record created:', payment.id)

        // Update Google Sheets - UPDATE existing row with second payment info
        try {
            await updateClientInSheet(client.email, {
                paymentStatus: paymentMethod === 'baridimob' ? 'En attente de vérification (2ème paiement)' : 'En attente (2ème paiement)',
                paymentType: '2ème paiement 50%',
                documents: {
                    paymentReceipt: receiptUrl || ''
                }
            })
            console.log('✅ Google Sheets updated with second payment')
        } catch (error) {
            console.error('⚠️ Google Sheets sync failed:', error)
            // Don't fail the payment if Google Sheets fails
        }

        return NextResponse.json({
            success: true,
            message: paymentMethod === 'baridimob' 
                ? 'Paiement enregistré avec succès. En attente de vérification (24-48h).'
                : 'Paiement en cours de traitement.',
            paymentId: payment.id
        })

    } catch (error: any) {
        console.error('❌ Second payment error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Erreur lors du traitement du paiement'
        }, { status: 500 })
    }
}
