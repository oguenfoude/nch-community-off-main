// lib/services/registration.service.ts
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import axios from 'axios'
import { 
  validateRegistration, 
  type RegistrationInput 
} from '@/lib/validators/registration.schema'
import { 
  calculatePaymentAmount, 
  getOfferPricing,
  getRemainingAmount 
} from '@/lib/constants/pricing'
import { appendClientToSheet } from '@/lib/googleSheetsService'
import { 
  emailExists, 
  generatePassword, 
  createClientWithPayment 
} from './client.service'

// ============================================
// REGISTRATION SERVICE
// ============================================

export interface RegistrationResult {
  success: boolean
  paymentRequired?: boolean
  paymentUrl?: string
  pendingId?: string
  clientId?: string
  credentials?: {
    email: string
    password: string
  }
  error?: string
  errors?: any[]
}

/**
 * Generate a unique session token
 */
function generateSessionToken(prefix: string = 'reg'): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`
}

/**
 * Make CIB/Edahabia transaction via SofizPay
 */
async function initiateSofizPayTransaction(params: {
  amount: number
  fullName: string
  phone: string
  email: string
  sessionToken: string
  memo: string
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const sofizPayUrl = 'https://www.sofizpay.com/make-cib-transaction/'
    
    const urlParams = new URLSearchParams({
      account: process.env.NEXT_PUBLIC_SOFIZPAY_API_KEY!,
      amount: params.amount.toString(),
      full_name: params.fullName,
      phone: params.phone,
      email: params.email,
      memo: params.memo,
      return_url: `${baseUrl}/api/payment-callback?token=${params.sessionToken}`,
      redirect: 'yes',
    })

    const fullUrl = `${sofizPayUrl}?${urlParams.toString()}`

    // Verify the URL is accessible
    const response = await axios.get(fullUrl, {
      headers: { 'Accept': 'application/json' }
    })

    return { success: true, url: fullUrl }
  } catch (error: any) {
    console.error('SofizPay error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Register client with CIB/Edahabia payment
 * Creates PendingRegistration and redirects to SofizPay
 */
export async function registerWithCardPayment(
  data: RegistrationInput
): Promise<RegistrationResult> {
  // 1. Check if email exists
  if (await emailExists(data.email)) {
    return { 
      success: false, 
      error: 'Un compte avec cet email existe déjà' 
    }
  }

  // 2. Generate password and session token
  const password = generatePassword(data.firstName, data.lastName)
  const sessionToken = generateSessionToken('card')

  // 3. Calculate payment amount
  const amount = calculatePaymentAmount(data.selectedOffer, data.paymentType)
  const remainingAmount = getRemainingAmount(data.selectedOffer, data.paymentType)

  // 4. Save to PendingRegistration
  const pendingReg = await prisma.pendingRegistration.create({
    data: {
      sessionToken,
      registrationData: {
        ...data,
        password, // Include generated password
      },
      paymentDetails: {
        amount,
        remainingAmount,
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        offer: data.selectedOffer,
      },
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }
  })

  // 5. Initiate SofizPay transaction
  const memoText = data.paymentType === 'full'
    ? `Paiement intégral NCH - ${data.selectedOffer}`
    : `Premier versement NCH - ${data.selectedOffer}`

  const paymentResult = await initiateSofizPayTransaction({
    amount,
    fullName: `${data.firstName} ${data.lastName}`,
    phone: data.phone,
    email: data.email,
    sessionToken,
    memo: memoText,
  })

  if (!paymentResult.success) {
    // Cleanup failed pending registration
    await prisma.pendingRegistration.delete({
      where: { id: pendingReg.id }
    })
    return { success: false, error: paymentResult.error }
  }

  // 6. Return payment URL
  return {
    success: true,
    paymentRequired: true,
    paymentUrl: paymentResult.url,
    credentials: { email: data.email, password },
  }
}

/**
 * Register client with BaridiMob payment
 * Creates PendingRegistration awaiting admin verification
 */
export async function registerWithBaridiMob(
  data: RegistrationInput,
  receiptUrl?: string
): Promise<RegistrationResult> {
  // 1. Check if email exists
  if (await emailExists(data.email)) {
    return { 
      success: false, 
      error: 'Un compte avec cet email existe déjà' 
    }
  }

  // 2. Generate password and session token
  const password = generatePassword(data.firstName, data.lastName)
  const sessionToken = generateSessionToken('baridimob')

  // 3. Calculate payment amount
  const amount = calculatePaymentAmount(data.selectedOffer, data.paymentType)

  // 4. Save to PendingRegistration with special status
  const pendingReg = await prisma.pendingRegistration.create({
    data: {
      sessionToken,
      registrationData: {
        ...data,
        password,
      },
      paymentDetails: {
        amount,
        paymentType: data.paymentType,
        paymentMethod: 'baridimob',
        offer: data.selectedOffer,
        baridiMobInfo: data.baridiMobInfo,
        receiptUrl: receiptUrl || null,
      },
      status: 'pending_verification', // Awaiting admin approval
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }
  })

  // 5. Sync to Google Sheets immediately (non-blocking)
  try {
    await appendClientToSheet({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      wilaya: data.wilaya,
      diploma: data.diploma,
      selectedOffer: data.selectedOffer,
      selectedCountries: data.selectedCountries || [],
      paymentMethod: 'baridimob',
      paymentType: data.paymentType || 'partial',
      paymentStatus: 'pending_verification',
      baridiMobInfo: data.baridiMobInfo || null,
      documents: data.documents || {},
      password: password,
      createdAt: new Date(),
    })
    console.log('✅ BaridiMob registration synced to Google Sheets')
  } catch (sheetError) {
    console.error('⚠️ Google Sheets sync failed (non-blocking):', sheetError)
  }

  return {
    success: true,
    paymentRequired: false,
    pendingId: pendingReg.id,
    credentials: { email: data.email, password },
  }
}

/**
 * Admin approves a BaridiMob pending registration
 */
export async function approveBaridiMobRegistration(
  pendingId: string,
  adminId: string
): Promise<RegistrationResult> {
  // 1. Get pending registration
  const pending = await prisma.pendingRegistration.findUnique({
    where: { id: pendingId }
  })

  if (!pending) {
    return { success: false, error: 'Inscription non trouvée' }
  }

  if (pending.status !== 'pending_verification') {
    return { success: false, error: 'Cette inscription a déjà été traitée' }
  }

  const regData = pending.registrationData as any
  const paymentDetails = pending.paymentDetails as any

  // 2. Check email still doesn't exist (double check)
  if (await emailExists(regData.email)) {
    await prisma.pendingRegistration.update({
      where: { id: pendingId },
      data: { status: 'rejected', rejectionReason: 'Email déjà utilisé' }
    })
    return { success: false, error: 'Un compte avec cet email existe déjà' }
  }

  // 3. Create client with payment record
  const { client, payment } = await createClientWithPayment(
    {
      firstName: regData.firstName,
      lastName: regData.lastName,
      email: regData.email,
      phone: regData.phone,
      wilaya: regData.wilaya,
      diploma: regData.diploma,
      selectedOffer: regData.selectedOffer,
      paymentMethod: 'baridimob',
      paymentType: regData.paymentType || 'partial',
      selectedCountries: regData.selectedCountries || [],
      documents: regData.documents || {},
      baridiMobInfo: regData.baridiMobInfo,
      password: regData.password,
    },
    {
      paymentType: 'initial',
      paymentMethod: 'baridimob',
      amount: paymentDetails.amount,
      status: 'verified',
      baridiMobInfo: paymentDetails.baridiMobInfo,
      receiptUrl: paymentDetails.receiptUrl,
      verifiedBy: adminId,
    }
  )

  // 4. Update pending registration status
  await prisma.pendingRegistration.update({
    where: { id: pendingId },
    data: { status: 'approved' }
  })

  return {
    success: true,
    clientId: client.id,
    credentials: {
      email: client.email,
      password: regData.password,
    }
  }
}

/**
 * Admin rejects a pending registration
 */
export async function rejectPendingRegistration(
  pendingId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const pending = await prisma.pendingRegistration.findUnique({
    where: { id: pendingId }
  })

  if (!pending) {
    return { success: false, error: 'Inscription non trouvée' }
  }

  await prisma.pendingRegistration.update({
    where: { id: pendingId },
    data: { 
      status: 'rejected',
      rejectionReason: reason,
    }
  })

  return { success: true }
}

/**
 * Get all pending BaridiMob registrations for admin
 */
export async function getPendingBaridiMobRegistrations() {
  return prisma.pendingRegistration.findMany({
    where: { status: 'pending_verification' },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Complete registration after successful SofizPay callback
 */
export async function completeCardPaymentRegistration(
  sessionToken: string,
  transactionId: string,
  sofizpayResponse: any
): Promise<RegistrationResult> {
  // 1. Get pending registration
  const pending = await prisma.pendingRegistration.findFirst({
    where: { sessionToken, status: 'pending' }
  })

  if (!pending) {
    return { success: false, error: 'Session expirée ou invalide' }
  }

  const regData = pending.registrationData as any
  const paymentDetails = pending.paymentDetails as any

  // 2. Create client with payment
  const { client, payment } = await createClientWithPayment(
    {
      firstName: regData.firstName,
      lastName: regData.lastName,
      email: regData.email,
      phone: regData.phone,
      wilaya: regData.wilaya,
      diploma: regData.diploma,
      selectedOffer: regData.selectedOffer,
      paymentMethod: regData.paymentMethod,
      paymentType: regData.paymentType || 'partial',
      selectedCountries: regData.selectedCountries || [],
      documents: regData.documents || {},
      password: regData.password,
    },
    {
      paymentType: 'initial',
      paymentMethod: regData.paymentMethod,
      amount: paymentDetails.amount,
      status: 'verified',
      transactionId,
      sofizpayResponse,
    }
  )

  // 3. Delete pending registration
  await prisma.pendingRegistration.delete({
    where: { id: pending.id }
  })

  return {
    success: true,
    clientId: client.id,
    credentials: {
      email: client.email,
      password: regData.password,
    }
  }
}
