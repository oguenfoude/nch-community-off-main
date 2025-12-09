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

        return NextResponse.json({
            success: true,
            client
        })

    } catch (error) {
        console.error('Erreur récupération profil:', error)
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        )
    }
}