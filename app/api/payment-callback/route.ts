// app/api/payment-callback/route.ts
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import SofizPaySDK from 'sofizpay-sdk-js'

// ✅ Helper function to calculate offer prices
function getOfferPrice(offer: string): number {
    const prices: { [key: string]: number } = {
        'basic': 21000,
        'premium': 28000,
        'gold': 35000
    }
    return prices[offer] || 21000
}

// ✅ Helper function to calculate amounts based on payment type
function calculatePaymentAmounts(offer: string, paymentType: string) {
    const basePrice = getOfferPrice(offer)
    
    if (paymentType === 'full') {
        return {
            totalAmount: basePrice,
            paidAmount: basePrice - 1000, // Full payment with 1000 discount
            remainingAmount: 0
        }
    } else {
        // Partial payment
        return {
            totalAmount: basePrice,
            paidAmount: basePrice * 0.5,
            remainingAmount: basePrice * 0.5
        }
    }
}

export async function GET(request: NextRequest) {
    try {
        const sdk = new SofizPaySDK()
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')
        
        console.log("📥 Payment callback received:", request.url)
        
        // ✅ Get SofizPay parameters
        const status = searchParams.get('payment_status')
        const transactionId = searchParams.get('transaction_id')
        const amount = searchParams.get('amount')
        const signature = searchParams.get('signature')
        const message = searchParams.get('message')
        
        console.log('💳 Callback data:', { token, status, transactionId, amount, message, signature })

        // ✅ Verify signature
        const isValid = sdk.verifySignature({
            message: message || '',
            signature_url_safe: signature
        })
        
        console.log("🔐 Signature valid:", isValid)

        if (!isValid) {
            console.log('❌ Invalid signature - reject request')
            return NextResponse.redirect(new URL('/error?reason=invalid_signature', request.url))
        }

        if (!token) {
            return NextResponse.redirect(new URL('/error?reason=invalid_token', request.url))
        }

        // ✅ Get pending registration from database
        const pendingRegistration = await prisma.pendingRegistration.findFirst({
            where: {
                sessionToken: token,
                status: 'pending'
            }
        })

        if (!pendingRegistration) {
            console.log('❌ Session not found or expired')
            return NextResponse.redirect(new URL('/error?reason=session_expired', request.url))
        }

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        // ✅ Handle successful payment
        if (status === 'success' || status === 'completed') {
            const registrationData = pendingRegistration.registrationData as any
            const paymentDetails = pendingRegistration.paymentDetails as any
            
            console.log('✅ Payment successful, creating client...')
            
            // ✅ CHECK IF THIS IS A SECOND PAYMENT (for partial payments)
            if (registrationData.isSecondPayment && registrationData.clientId) {
                console.log('🔵 Processing second payment for client:', registrationData.clientId)
                
                const client = await prisma.client.findUnique({
                    where: { id: registrationData.clientId }
                })

                if (client) {
                    // Update to fully paid
                    await prisma.client.update({
                        where: { id: client.id },
                        data: {
                            paymentStatus: 'paid',
                            paidAmount: client.totalAmount,
                            remainingAmount: 0,
                            updatedAt: new Date()
                        }
                    })

                    console.log('✅ Second payment completed for client:', client.email)

                    // Delete the pending registration
                    await prisma.pendingRegistration.delete({
                        where: { sessionToken: token }
                    })

                    // Redirect to dashboard with success message
                    return NextResponse.redirect(
                        new URL(`/me?payment=success&type=second`, baseUrl)
                    )
                }
            } else {
                // ✅ FIRST PAYMENT LOGIC (Registration)
                console.log('🔵 Processing first payment (registration)')
                
                // Calculate amounts based on payment type
                const paymentType = paymentDetails.paymentType || registrationData.paymentType || 'partial'
                const amounts = calculatePaymentAmounts(registrationData.selectedOffer, paymentType)
                
                // Determine payment status
                const paymentStatus = paymentType === 'full' ? 'paid' : 'partially_paid'
                
                console.log('💰 Payment details:', {
                    paymentType,
                    totalAmount: amounts.totalAmount,
                    paidAmount: amounts.paidAmount,
                    remainingAmount: amounts.remainingAmount,
                    paymentStatus
                })
                
                // Create the client
                const client = await prisma.client.create({
                    data: {
                        firstName: registrationData.firstName,
                        lastName: registrationData.lastName,
                        email: registrationData.email,
                        phone: registrationData.phone,
                        wilaya: registrationData.wilaya,
                        diploma: registrationData.diploma,
                        selectedOffer: registrationData.selectedOffer,
                        paymentMethod: registrationData.paymentMethod,
                        
                        // ✅ Payment tracking
                        paymentType: paymentType,
                        paymentStatus: paymentStatus,
                        totalAmount: amounts.totalAmount,
                        paidAmount: amounts.paidAmount,
                        remainingAmount: amounts.remainingAmount,
                        
                        // ✅ Other data
                        baridiMobInfo: registrationData.baridiMobInfo || null,
                        paymentReceipt: registrationData.paymentReceipt || null,
                        selectedCountries: registrationData.selectedCountries || [],
                        documents: registrationData.documents || {},
                        driveFolder: registrationData.driveFolder || {},
                        password: registrationData.password,
                        status: 'pending',
                    }
                })

                console.log('✅ Client created successfully:', client.email)

                // TODO: Send email with credentials
                // await sendCredentialsEmail(client.email, client.firstName, client.lastName, client.password)

                // Delete the pending registration
                await prisma.pendingRegistration.delete({
                    where: { sessionToken: token }
                })

                // Redirect to success page
                const successUrl = paymentType === 'full' 
                    ? `/success?email=${client.email}&type=full`
                    : `/success?email=${client.email}&type=partial&remaining=${amounts.remainingAmount}`
                
                return NextResponse.redirect(new URL(successUrl, baseUrl))
            }
        }

        // ✅ Handle failed payment
        if (status === 'failed' || status === 'cancelled') {
            console.log('❌ Payment failed or cancelled')
            
            // Delete the pending registration
            await prisma.pendingRegistration.delete({
                where: { sessionToken: token }
            })

            return NextResponse.redirect(
                new URL('/error?reason=payment_failed', request.url)
            )
        }

        // ✅ Handle pending payment (shouldn't happen often)
        console.log('⏳ Payment pending...')
        return NextResponse.redirect(
            new URL('/error?reason=payment_pending', request.url)
        )

    } catch (error: any) {
        console.error('❌ Callback error:', error)
        return NextResponse.redirect(
            new URL('/error?reason=callback_error', request.url)
        )
    }
}

// ✅ Optional: Validation de signature (if you want additional security)
function validateSofizPaySignature(params: URLSearchParams, signature: string): boolean {
    const secret = process.env.SOFIZPAY_WEBHOOK_SECRET
    if (!secret) return false

    const payload = params.toString()
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex')

    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    )
}