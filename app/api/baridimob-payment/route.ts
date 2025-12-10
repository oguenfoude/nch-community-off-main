// app/api/baridimob-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { sessionToken, receiptUrl } = body

        console.log('📱 BaridiMob payment submission:', { sessionToken, receiptUrl })

        if (!sessionToken || !receiptUrl) {
            return NextResponse.json({
                success: false,
                error: 'Session token et reçu requis'
            }, { status: 400 })
        }

        // 1. Get pending registration
        const pendingReg = await prisma.pendingRegistration.findUnique({
            where: { sessionToken }
        })

        if (!pendingReg) {
            return NextResponse.json({
                success: false,
                error: 'Session de paiement invalide'
            }, { status: 404 })
        }

        const regData = pendingReg.registrationData as any
        const paymentDetails = pendingReg.paymentDetails as any

        // Check if this is a second payment (has clientId)
        const isSecondPayment = !!regData.clientId

        if (isSecondPayment) {
            // ===== SECOND PAYMENT FLOW =====
            const clientId = regData.clientId

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

            // Create second payment record - AWAITING ADMIN VERIFICATION
            const payment = await prisma.payment.create({
                data: {
                    clientId: client.id,
                    paymentType: 'second',
                    paymentMethod: 'baridimob',
                    amount: parseFloat(paymentDetails.amount),
                    status: 'paid', // Status: Payment submitted, awaiting admin verification
                    receiptUrl: receiptUrl,
                    baridiMobInfo: {
                        email: 'contact@nch-community.online',
                        rip: '00799999004145522768',
                        ccp: '0041455227',
                        key: '68'
                    }
                }
            })

            console.log('✅ Second payment record created:', payment.id)

            // Update pending registration
            await prisma.pendingRegistration.update({
                where: { id: pendingReg.id },
                data: { status: 'approved' }
            })

            // Sync to Google Sheets
            try {
                await fetch(`${process.env.NEXTAUTH_URL}/api/google-sheets`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'second_payment',
                        clientId: client.id,
                        firstName: client.firstName,
                        lastName: client.lastName,
                        email: client.email,
                        phone: client.phone,
                        offer: client.selectedOffer,
                        paymentMethod: 'baridimob',
                        amount: payment.amount,
                        receiptUrl: receiptUrl
                    })
                })
            } catch (error) {
                console.error('⚠️ Google Sheets sync failed:', error)
            }

            return NextResponse.json({
                success: true,
                message: 'Paiement BaridiMob soumis avec succès. Un administrateur vérifiera votre reçu sous peu.',
                paymentId: payment.id,
                status: 'submitted', // Clear status for frontend
                nextSteps: 'Votre paiement sera vérifié par un administrateur. Vous recevrez une confirmation par email.'
            })

        } else {
            // ===== INITIAL REGISTRATION FLOW (OLD BEHAVIOR) =====
            // This handles registration with BaridiMob payment
            return NextResponse.json({
                success: false,
                error: 'Cette route est pour les paiements seconds uniquement. Utilisez /api/register pour l\'inscription initiale.'
            }, { status: 400 })
        }

    } catch (error: any) {
        console.error('❌ BaridiMob payment error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Erreur lors du traitement du paiement'
        }, { status: 500 })
    }
}

// ✅ GET endpoint to check payment verification status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const sessionToken = searchParams.get('token')

        if (!sessionToken) {
            return NextResponse.json(
                { success: false, error: 'Missing session token' },
                { status: 400 }
            )
        }

        const pendingRegistration = await prisma.pendingRegistration.findFirst({
            where: { sessionToken }
        })

        if (!pendingRegistration) {
            return NextResponse.json(
                { success: false, error: 'Registration not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            status: pendingRegistration.status,
            registrationData: pendingRegistration.registrationData
        })

    } catch (error) {
        console.error('❌ Status check error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to check status' },
            { status: 500 }
        )
    }
}