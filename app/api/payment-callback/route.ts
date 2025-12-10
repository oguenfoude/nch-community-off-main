// app/api/payment-callback/route.ts
// ============================================
// REFACTORED: Uses service layer for clean separation
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import SofizPaySDK from 'sofizpay-sdk-js'
import { 
  completeCardPaymentRegistration 
} from '@/lib/services/registration.service'
import { 
  completeSecondPayment 
} from '@/lib/services/payment.service'
import { prisma } from '@/lib/prisma'
import { getRemainingAmount } from '@/lib/constants/pricing'

export async function GET(request: NextRequest) {
  try {
    const sdk = new SofizPaySDK()
    const { searchParams } = new URL(request.url)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // ============================================
    // 1. EXTRACT CALLBACK PARAMETERS
    // ============================================
    const token = searchParams.get('token')
    const status = searchParams.get('payment_status')
    const transactionId = searchParams.get('transaction_id')
    const amount = searchParams.get('amount')
    const signature = searchParams.get('signature')
    const message = searchParams.get('message')

    console.log('📥 Payment callback received:', { token, status, transactionId, amount })

    // ============================================
    // 2. VERIFY SIGNATURE
    // ============================================
    const isValid = sdk.verifySignature({
      message: message || '',
      signature_url_safe: signature || ''
    })

    console.log('🔐 Signature valid:', isValid)

    if (!isValid) {
      console.log('❌ Invalid signature')
      return NextResponse.redirect(new URL('/error?reason=invalid_signature', baseUrl))
    }

    if (!token) {
      console.log('❌ Missing token')
      return NextResponse.redirect(new URL('/error?reason=invalid_token', baseUrl))
    }

    // ============================================
    // 3. HANDLE FAILED PAYMENT
    // ============================================
    if (status === 'failed' || status === 'cancelled') {
      console.log('❌ Payment failed or cancelled')
      
      // Clean up pending registration
      await prisma.pendingRegistration.deleteMany({
        where: { sessionToken: token }
      })
      
      return NextResponse.redirect(new URL('/error?reason=payment_failed', baseUrl))
    }

    // ============================================
    // 4. HANDLE SUCCESSFUL PAYMENT
    // ============================================
    if (status === 'success' || status === 'completed') {
      console.log('✅ Payment successful, processing...')

      // Get pending registration to check type
      const pending = await prisma.pendingRegistration.findFirst({
        where: { sessionToken: token, status: 'pending' }
      })

      if (!pending) {
        console.log('❌ Session not found or expired')
        return NextResponse.redirect(new URL('/error?reason=session_expired', baseUrl))
      }

      const regData = pending.registrationData as any

      const sofizpayResponse = {
        status,
        transactionId,
        amount,
        signature,
        message,
        timestamp: new Date().toISOString(),
      }

      // ============================================
      // 4A. SECOND PAYMENT (existing client)
      // ============================================
      if (regData.isSecondPayment && regData.clientId) {
        console.log('🔵 Processing second payment for client:', regData.clientId)
        
        const result = await completeSecondPayment(
          token,
          transactionId || '',
          sofizpayResponse
        )

        if (!result.success) {
          console.log('❌ Second payment failed:', result.error)
          return NextResponse.redirect(new URL('/error?reason=payment_error', baseUrl))
        }

        console.log('✅ Second payment completed')
        return NextResponse.redirect(new URL('/me?payment=success&type=second', baseUrl))
      }

      // ============================================
      // 4B. INITIAL PAYMENT (new registration)
      // ============================================
      console.log('🔵 Processing initial payment (new registration)')
      
      const result = await completeCardPaymentRegistration(
        token,
        transactionId || '',
        sofizpayResponse
      )

      if (!result.success) {
        console.log('❌ Registration completion failed:', result.error)
        return NextResponse.redirect(new URL('/error?reason=registration_error', baseUrl))
      }

      console.log('✅ Client created successfully:', result.credentials?.email)

      // Build success URL
      const paymentType = regData.paymentType || 'partial'
      const remainingAmount = getRemainingAmount(regData.selectedOffer, paymentType)
      
      const successParams = new URLSearchParams({
        email: result.credentials?.email || '',
        type: paymentType,
      })
      
      if (paymentType === 'partial') {
        successParams.set('remaining', remainingAmount.toString())
      }

      return NextResponse.redirect(new URL(`/success?${successParams.toString()}`, baseUrl))
    }

    // ============================================
    // 5. HANDLE PENDING STATUS
    // ============================================
    console.log('⏳ Payment status pending...')
    return NextResponse.redirect(new URL('/error?reason=payment_pending', baseUrl))

  } catch (error: any) {
    console.error('❌ Callback error:', error)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL('/error?reason=callback_error', baseUrl))
  }
}
