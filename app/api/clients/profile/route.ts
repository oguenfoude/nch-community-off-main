import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PRICING, type OfferType } from '@/lib/constants/pricing'

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
                        receiptUrl: true,
                        rejectionReason: true,
                        baridiMobInfo: true,
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

        // Get pricing info for the client's offer
        const offerKey = client.selectedOffer?.toLowerCase() as OfferType
        const pricing = PRICING[offerKey] || PRICING.basic
        const fullPaymentPrice = pricing.total - pricing.fullDiscount // e.g., 27000 for premium
        const partialPaymentPrice = pricing.initial // e.g., 14000 for premium

        // Calculate payment status
        const payments = client.payments || []
        
        // Include 'paid' status (submitted, awaiting verification) in calculations
        const verifiedPayments = payments.filter(p => p.status === 'verified' || p.status === 'completed')
        const submittedPayments = payments.filter(p => p.status === 'paid') // Awaiting admin verification
        
        const totalVerified = verifiedPayments.reduce((sum, p) => sum + p.amount, 0)
        const totalSubmitted = submittedPayments.reduce((sum, p) => sum + p.amount, 0)
        const totalPaid = totalVerified + totalSubmitted // Include submitted payments in total
        
        const hasPendingVerification = payments.some(p => (p.status === 'paid' || p.status === 'pending') && p.paymentMethod === 'baridimob')
        
        // Determine if client chose full payment (paid ~27000) or partial (paid ~14000)
        const isFullPayment = totalPaid >= fullPaymentPrice * 0.95 // Allow 5% tolerance
        const expectedTotal = isFullPayment ? fullPaymentPrice : pricing.total
        const remainingAmount = expectedTotal - totalPaid
        
        // Determine payment status
        let paymentStatus = 'unpaid'
        if (totalPaid >= fullPaymentPrice) {
            // Has paid enough (full payment with discount)
            paymentStatus = hasPendingVerification ? 'pending' : 'paid'
        } else if (totalPaid > 0 && totalPaid < pricing.total) {
            paymentStatus = 'partially_paid'
        } else if (payments.some(p => p.status === 'pending' || p.status === 'paid')) {
            paymentStatus = 'pending'
        }

        const enrichedClient = {
            ...client,
            paymentStatus,
            totalAmount: expectedTotal, // Show 27000 if full payment, 28000 if partial
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