// app/api/baridimob-payment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinaryService'

export async function POST(request: NextRequest) {
    try {
        const formDataReq = await request.formData()
        
        const receiptFile = formDataReq.get('receipt') as File
        const clientData = formDataReq.get('clientData') as string
        
        if (!receiptFile || !clientData) {
            return NextResponse.json(
                { success: false, error: 'Missing receipt or client data' },
                { status: 400 }
            )
        }

        const parsedClientData = JSON.parse(clientData)
        
        // ✅ Upload receipt to Cloudinary
        const receiptBuffer = await receiptFile.arrayBuffer()
        const receiptUploadResult = await uploadToCloudinary(
            Buffer.from(receiptBuffer),
            receiptFile.name,
            {
                folder: `nch-community/baridimob-receipts`,
                resourceType: receiptFile.type === 'application/pdf' ? 'raw' : 'image'
            }
        )

        // ✅ Create pending registration with BaridiMob payment status
        const sessionToken = `baridimob_${Date.now()}_${Math.random().toString(36)}`
        
        const pendingRegistration = await prisma.pendingRegistration.create({
            data: {
                sessionToken,
                status: 'pending_verification', // ✅ Special status for BaridiMob
                registrationData: {
                    ...parsedClientData,
                    paymentMethod: 'baridimob',
                    paymentStatus: 'pending_verification',
                    paymentReceipt: {
                        fileId: receiptUploadResult.publicId,
                        url: receiptUploadResult.secureUrl,
                        downloadUrl: receiptUploadResult.secureUrl,
                        name: receiptFile.name,
                        size: receiptFile.size.toString(),
                        type: receiptFile.type
                    }
                }
            }
        })

        // ✅ TODO: Send notification email to admin for manual verification
        // await sendAdminNotificationEmail(parsedClientData, receiptUploadResult)

        return NextResponse.json({
            success: true,
            message: 'Registration submitted successfully. Awaiting payment verification.',
            sessionToken,
            registrationId: pendingRegistration.id
        })

    } catch (error) {
        console.error('❌ BaridiMob payment processing error:', error)
        return NextResponse.json(
            { 
                success: false, 
                error: 'Payment processing failed', 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
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