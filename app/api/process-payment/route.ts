import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import SofizPaySDK from 'sofizpay-sdk-js'

// ✅ ADD THIS FUNCTION (from your document 6)
const makeCIBTransaction = async (transactionData: { 
    account: string
    amount: number
    full_name: string
    phone: string
    email: string
    return_url: string
    memo: string
    redirect: string | undefined
}) => {
    if (!transactionData.account) {
        throw new Error('Account is required.')
    }
    if (!transactionData.amount || transactionData.amount <= 0) {
        throw new Error('Valid amount is required.')
    }
    if (!transactionData.full_name) {
        throw new Error('Full name is required.')
    }
    if (!transactionData.phone) {
        throw new Error('Phone number is required.')
    }
    if (!transactionData.email) {
        throw new Error('Email is required.')
    }

    try {
        const baseUrl = 'https://www.sofizpay.com/make-cib-transaction/'
        const params = new URLSearchParams()

        params.append('account', transactionData.account)
        params.append('amount', transactionData.amount.toString())
        params.append('full_name', transactionData.full_name)
        params.append('phone', transactionData.phone)
        params.append('email', transactionData.email)

        if (transactionData.return_url) {
            params.append('return_url', transactionData.return_url)
        }
        if (transactionData.memo) {
            params.append('memo', transactionData.memo)
        }
        if (transactionData.redirect !== undefined) {
            params.append('redirect', transactionData.redirect)
        }

        const fullUrl = `${baseUrl}?${params.toString()}`

        const axios = require('axios')
        const response = await axios.get(fullUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })

        return {
            success: true,
            data: response.data,
            url: fullUrl,
            account: transactionData.account,
            amount: transactionData.amount,
            full_name: transactionData.full_name,
            phone: transactionData.phone,
            email: transactionData.email,
            memo: transactionData.memo,
            timestamp: new Date().toISOString()
        }
    } catch (error: any) {
        console.error('Error making CIB transaction:', error)

        let errorMessage = error.message

        if (error.response) {
            errorMessage = `HTTP Error: ${error.response.status} - ${error.response.statusText}`
            if (error.response.data && error.response.data.error) {
                errorMessage += ` - ${error.response.data.error}`
            }
        } else if (error.request) {
            errorMessage = 'Network error: No response received from server'
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'Request timeout: Server took too long to respond'
        }

        return {
            success: false,
            error: errorMessage,
            account: transactionData.account,
            amount: transactionData.amount,
            timestamp: new Date().toISOString()
        }
    }
}

// ✅ MAIN POST HANDLER
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { clientId, amount, paymentMethod, isSecondPayment } = body

        console.log('🔵 Payment request:', { clientId, amount, paymentMethod, isSecondPayment })

        // ✅ Validate client exists and needs second payment
        if (isSecondPayment && clientId) {
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                include: { stages: true, payments: true }
            })

            if (!client) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Client not found' 
                }, { status: 404 })
            }

            // Check if first payment is completed (client should have exactly 1 completed payment)
            const completedPayments = client.payments?.filter(p => p.status === 'completed') || []
            const hasFirstPaymentOnly = completedPayments.length === 1 && completedPayments[0].paymentType === 'initial'
            
            if (!hasFirstPaymentOnly) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Second payment not required or already completed.' 
                }, { status: 400 })
            }

            // Check if stage 2 is completed
            const stage2 = client.stages?.find(s => s.stageNumber === 2)
            if (!stage2 || stage2.status !== 'completed') {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Stage 2 must be completed before second payment' 
                }, { status: 400 })
            }
        }

        // ✅ Create payment session
        const sessionToken = crypto.randomBytes(32).toString('hex')

        // Store payment intent
        await prisma.pendingRegistration.create({
            data: {
                sessionToken,
                registrationData: {
                    clientId: clientId || null,
                    isSecondPayment: isSecondPayment || false,
                    amount,
                    paymentMethod
                },
                paymentDetails: {},
                status: 'pending'
            }
        })

        // ✅ Generate payment URL based on method
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const returnUrl = `${baseUrl}/api/payment-callback?token=${sessionToken}`

        let paymentUrl = ''
        let paymentData = null

        if (paymentMethod === 'cib') {
            // Get client details for payment
            let clientDetails = { firstName: '', lastName: '', phone: '', email: '' }
            
            if (clientId) {
                const client = await prisma.client.findUnique({
                    where: { id: clientId }
                })
                if (client) {
                    clientDetails = {
                        firstName: client.firstName,
                        lastName: client.lastName,
                        phone: client.phone,
                        email: client.email
                    }
                }
            }

            // CIB payment logic
            const result = await makeCIBTransaction({
                account: process.env.NEXT_PUBLIC_SOFIZPAY_API_KEY!,
                amount: parseFloat(amount),
                full_name: `${clientDetails.firstName} ${clientDetails.lastName}`,
                phone: clientDetails.phone,
                email: clientDetails.email,
                return_url: returnUrl,
                memo: isSecondPayment ? `Second Payment - ${clientId}` : 'Registration Payment',
                redirect: "yes"
            })

            if (result.success) {
                paymentUrl = result.data?.url || result.url
                paymentData = result
            } else {
                throw new Error(result.error || 'CIB transaction failed')
            }
        } else if (paymentMethod === 'edahabia') {
            // Add EDAHABIA logic here
            paymentUrl = `${baseUrl}/payment/edahabia?token=${sessionToken}`
        } else if (paymentMethod === 'baridimob') {
            // Add BaridiMob logic here
            paymentUrl = `${baseUrl}/payment/baridimob?token=${sessionToken}`
        }

        console.log('✅ Payment URL generated:', paymentUrl)

        return NextResponse.json({
            success: true,
            paymentUrl,
            sessionToken,
            paymentData
        })

    } catch (error: any) {
        console.error('❌ Payment processing error:', error)
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Payment processing failed' 
        }, { status: 500 })
    }
}