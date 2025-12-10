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
        const totalPaid = payments.filter(p => p.status === 'verified' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
        const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
        const hasPendingVerification = payments.some(p => p.status === 'paid' && p.paymentMethod === 'baridimob')
        
        let paymentStatus = 'unpaid'
        if (totalPaid > 0 && totalPending === 0) {
            paymentStatus = 'paid'
        } else if (totalPaid > 0 && totalPending > 0) {
            paymentStatus = 'partially_paid'
        } else if (totalPending > 0) {
            paymentStatus = 'pending'
        }

        const enrichedClient = {
            ...client,
            paymentStatus,
            totalAmount: totalPaid + totalPending,
            paidAmount: totalPaid,
            remainingAmount: totalPending,
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