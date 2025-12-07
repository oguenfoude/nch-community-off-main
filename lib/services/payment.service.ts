// lib/services/payment.service.ts
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import crypto from 'crypto'
import { getSecondPaymentAmount } from '@/lib/constants/pricing'
import { addPaymentToClient } from './client.service'

// ============================================
// PAYMENT SERVICE
// ============================================

export interface PaymentResult {
  success: boolean
  paymentUrl?: string
  error?: string
}

/**
 * Generate session token for second payment
 */
function generatePaymentToken(): string {
  return `pay2_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`
}

/**
 * Initiate second payment for existing client
 */
export async function initiateSecondPayment(
  clientId: string,
  paymentMethod: 'cib' | 'edahabia'
): Promise<PaymentResult> {
  // 1. Get client
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { payments: true }
  })

  if (!client) {
    return { success: false, error: 'Client non trouvé' }
  }

  // 2. Check if initial payment was made
  const hasInitialPayment = client.payments.some(
    p => p.paymentType === 'initial' && p.status === 'verified'
  )

  if (!hasInitialPayment) {
    return { success: false, error: 'Premier paiement non effectué' }
  }

  // 3. Check if second payment already made
  const hasSecondPayment = client.payments.some(
    p => p.paymentType === 'second' && p.status === 'verified'
  )

  if (hasSecondPayment) {
    return { success: false, error: 'Deuxième paiement déjà effectué' }
  }

  // 4. Calculate amount
  const amount = getSecondPaymentAmount(client.selectedOffer)

  // 5. Create pending registration for payment tracking
  const sessionToken = generatePaymentToken()
  
  await prisma.pendingRegistration.create({
    data: {
      sessionToken,
      registrationData: {
        isSecondPayment: true,
        clientId: client.id,
        email: client.email,
      },
      paymentDetails: {
        amount,
        paymentMethod,
        paymentType: 'second',
      },
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  })

  // 6. Initiate SofizPay
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const sofizPayUrl = 'https://www.sofizpay.com/make-cib-transaction/'

  const urlParams = new URLSearchParams({
    account: process.env.NEXT_PUBLIC_SOFIZPAY_API_KEY!,
    amount: amount.toString(),
    full_name: `${client.firstName} ${client.lastName}`,
    phone: client.phone,
    email: client.email,
    memo: `Deuxième versement NCH - ${client.selectedOffer}`,
    return_url: `${baseUrl}/api/payment-callback?token=${sessionToken}`,
    redirect: 'yes',
  })

  const fullUrl = `${sofizPayUrl}?${urlParams.toString()}`

  return { success: true, paymentUrl: fullUrl }
}

/**
 * Complete second payment after SofizPay callback
 */
export async function completeSecondPayment(
  sessionToken: string,
  transactionId: string,
  sofizpayResponse: any
): Promise<{ success: boolean; clientId?: string; error?: string }> {
  // 1. Get pending
  const pending = await prisma.pendingRegistration.findFirst({
    where: { sessionToken, status: 'pending' }
  })

  if (!pending) {
    return { success: false, error: 'Session invalide' }
  }

  const regData = pending.registrationData as any
  const paymentDetails = pending.paymentDetails as any

  if (!regData.isSecondPayment || !regData.clientId) {
    return { success: false, error: 'Données de paiement invalides' }
  }

  // 2. Add payment to client
  await addPaymentToClient(regData.clientId, {
    paymentType: 'second',
    paymentMethod: paymentDetails.paymentMethod,
    amount: paymentDetails.amount,
    status: 'verified',
    transactionId,
    sofizpayResponse,
  })

  // 3. Update client status if needed
  await prisma.client.update({
    where: { id: regData.clientId },
    data: { status: 'processing' } // Move to processing after full payment
  })

  // 4. Delete pending
  await prisma.pendingRegistration.delete({
    where: { id: pending.id }
  })

  return { success: true, clientId: regData.clientId }
}

/**
 * Get payment history for a client
 */
export async function getClientPayments(clientId: string) {
  return prisma.payment.findMany({
    where: { clientId },
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * Verify SofizPay signature
 */
export function verifySofizPaySignature(
  message: string,
  signature: string
): boolean {
  // This uses the SofizPay SDK internally
  // For now, we'll import and use the SDK in the route
  return true // Placeholder - actual verification in route
}
