import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const sessionToken = searchParams.get('token')

        if (!sessionToken) {
            return NextResponse.json({
                success: false,
                error: 'Token manquant'
            }, { status: 400 })
        }

        // Get pending registration
        const pendingReg = await prisma.pendingRegistration.findUnique({
            where: { sessionToken }
        })

        if (!pendingReg) {
            return NextResponse.json({
                success: false,
                error: 'Session invalide'
            }, { status: 404 })
        }

        const paymentDetails = pendingReg.paymentDetails as any

        return NextResponse.json({
            success: true,
            details: {
                amount: paymentDetails.amount,
                paymentMethod: paymentDetails.paymentMethod
            }
        })

    } catch (error: any) {
        console.error('Error fetching payment details:', error)
        return NextResponse.json({
            success: false,
            error: 'Erreur serveur'
        }, { status: 500 })
    }
}
