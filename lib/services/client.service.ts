// lib/services/client.service.ts
import { prisma } from '@/lib/prisma'
import type { RegistrationInput } from '@/lib/validators/registration.schema'
import { appendClientToSheet } from '@/lib/googleSheetsService'

// ============================================
// CLIENT SERVICE - CRUD Operations
// ============================================

/**
 * Generate a random password for client
 */
export function generatePassword(firstName: string, lastName: string): string {
  const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase()
  const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase()
  const randomNum = Math.floor(Math.random() * 9000) + 1000
  return `${cleanFirst}-${cleanLast}-${randomNum}`
}

/**
 * Check if email already exists
 */
export async function emailExists(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  
  const existing = await prisma.client.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  })
  
  return existing !== null
}

/**
 * Check if email exists in pending registrations
 */
export async function emailExistsInPending(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase()
  
  // For MongoDB with Prisma, we need to use raw query or check differently
  // Since registrationData is a Json field, we check all pending and filter
  const pending = await prisma.pendingRegistration.findMany({
    where: {
      status: { in: ['pending', 'pending_verification'] },
    },
    select: { id: true, registrationData: true }
  })
  
  return pending.some(p => {
    const data = p.registrationData as any
    return data?.email?.toLowerCase() === normalizedEmail
  })
}

/**
 * Create a new client with payment record
 */
export async function createClientWithPayment(
  data: RegistrationInput & { password: string },
  paymentInfo: {
    paymentType: 'initial' | 'second'
    paymentMethod: string
    amount: number
    status: string
    baridiMobInfo?: any
    receiptUrl?: string
    transactionId?: string
    sofizpayResponse?: any
    verifiedBy?: string
  }
) {
  // Create client
  const client = await prisma.client.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      wilaya: data.wilaya,
      diploma: data.diploma,
      password: data.password, // Plain text as requested
      selectedOffer: data.selectedOffer,
      selectedCountries: data.selectedCountries || [],
      documents: data.documents || {},
      driveFolder: { provider: 'cloudinary', createdAt: new Date().toISOString() },
      status: 'pending',
    }
  })

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      clientId: client.id,
      paymentType: paymentInfo.paymentType,
      paymentMethod: paymentInfo.paymentMethod,
      amount: paymentInfo.amount,
      status: paymentInfo.status,
      baridiMobInfo: paymentInfo.baridiMobInfo || null,
      receiptUrl: paymentInfo.receiptUrl || null,
      transactionId: paymentInfo.transactionId || null,
      sofizpayResponse: paymentInfo.sofizpayResponse || null,
      verifiedBy: paymentInfo.verifiedBy || null,
      verifiedAt: paymentInfo.verifiedBy ? new Date() : null,
    }
  })

  // ============================================
  // SYNC TO GOOGLE SHEETS (non-blocking)
  // ============================================
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
      paymentMethod: paymentInfo.paymentMethod,
      paymentType: paymentInfo.paymentType,
      paymentStatus: paymentInfo.status,
      baridiMobInfo: paymentInfo.baridiMobInfo || null,
      documents: data.documents || {},
      password: data.password,
      createdAt: new Date(),
    })
    console.log('✅ Client synced to Google Sheets')
  } catch (sheetError) {
    // Log but don't fail registration
    console.error('⚠️ Google Sheets sync failed (non-blocking):', sheetError)
  }

  return { client, payment }
}

/**
 * Get client by ID with payments
 */
export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: { payments: true, stages: true }
  })
}

/**
 * Get client by email
 */
export async function getClientByEmail(email: string) {
  return prisma.client.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { payments: true }
  })
}

/**
 * Update client status
 */
export async function updateClientStatus(id: string, status: string) {
  return prisma.client.update({
    where: { id },
    data: { status }
  })
}

/**
 * Add payment to existing client
 */
export async function addPaymentToClient(
  clientId: string,
  paymentInfo: {
    paymentType: 'initial' | 'second'
    paymentMethod: string
    amount: number
    status: string
    transactionId?: string
    sofizpayResponse?: any
  }
) {
  return prisma.payment.create({
    data: {
      clientId,
      paymentType: paymentInfo.paymentType,
      paymentMethod: paymentInfo.paymentMethod,
      amount: paymentInfo.amount,
      status: paymentInfo.status,
      transactionId: paymentInfo.transactionId || null,
      sofizpayResponse: paymentInfo.sofizpayResponse || null,
    }
  })
}

/**
 * Get client's payment status
 */
export async function getClientPaymentStatus(clientId: string) {
  const payments = await prisma.payment.findMany({
    where: { clientId },
    orderBy: { createdAt: 'asc' }
  })

  const totalPaid = payments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + p.amount, 0)

  const hasInitialPayment = payments.some(
    p => p.paymentType === 'initial' && p.status === 'verified'
  )

  const hasSecondPayment = payments.some(
    p => p.paymentType === 'second' && p.status === 'verified'
  )

  return {
    payments,
    totalPaid,
    hasInitialPayment,
    hasSecondPayment,
    isFullyPaid: hasInitialPayment && hasSecondPayment,
  }
}
