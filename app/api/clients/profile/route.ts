import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()

        if (!session || session.user.userType !== 'client') {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            )
        }

        // Récupérer les informations du client
        const client = await prisma.client.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                wilaya: true,
                diploma: true,
                selectedOffer: true,
                // Note: paymentMethod, paymentType, paymentStatus, totalAmount, paidAmount, remainingAmount, baridiMobInfo
                // are now on Payment model, include payments relation instead
                status: true,
                selectedCountries: true,
                documents: true,
                driveFolder: true,
                createdAt: true,
                updatedAt: true,
                payments: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        paymentMethod: true,
                        paymentType: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                stages: {
                    orderBy: { stageNumber: 'asc' }
                }
            }
        })

        if (!client) {
            return NextResponse.json(
                { error: 'Client non trouvé' },
                { status: 404 }
            )
        }

        // Calculate payment status
        const payments = client.payments || []
        const completedPayments = payments.filter(p => p.status === 'verified' || p.status === 'completed')
        const totalPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0)
        const hasPendingVerification = payments.some(p => p.status === 'paid' && p.paymentMethod === 'baridimob')
        
        // Get total price from offer
        const offerPrices = {
            'basic': 21000,
            'premium': 28000,
            'gold': 35000
        }
        const totalPrice = offerPrices[client.selectedOffer?.toLowerCase() as keyof typeof offerPrices] || 0
        const remainingAmount = totalPrice - totalPaid
        
        // Determine payment status
        let paymentStatus = 'unpaid'
        if (totalPaid >= totalPrice) {
            paymentStatus = 'paid'
        } else if (totalPaid > 0 && totalPaid < totalPrice) {
            paymentStatus = 'partially_paid'
        } else if (payments.some(p => p.status === 'pending')) {
            paymentStatus = 'pending'
        }

        const enrichedClient = {
            ...client,
            paymentStatus,
            totalAmount: totalPrice,
            paidAmount: totalPaid,
            remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
            hasPendingVerification
        }

        return NextResponse.json({
            success: true,
            client: enrichedClient
        })

    } catch (error) {
        console.error('Erreur récupération profil:', error)
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        )
    }
}