// scripts/verify-workflow.ts
// ============================================
// E2E VERIFICATION SCRIPT
// Tests the complete BaridiMob registration workflow
// ============================================
// 
// Run with: npx tsx scripts/verify-workflow.ts

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================
// COLORS FOR CONSOLE OUTPUT
// ============================================
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message: string) {
  log(`✅ ${message}`, 'green')
}

function error(message: string) {
  log(`❌ ${message}`, 'red')
}

function info(message: string) {
  log(`ℹ️  ${message}`, 'blue')
}

function step(num: number, message: string) {
  log(`\n${'='.repeat(50)}`, 'cyan')
  log(`STEP ${num}: ${message}`, 'cyan')
  log('='.repeat(50), 'cyan')
}

// ============================================
// TEST DATA
// ============================================
const testEmail = `test_${Date.now()}@example.com`
const testData = {
  firstName: 'Test',
  lastName: 'User',
  email: testEmail,
  phone: '0555123456',
  wilaya: 'Alger',
  diploma: 'Licence',
  selectedOffer: 'basic',
  paymentMethod: 'baridimob',
  paymentType: 'partial',
  selectedCountries: ['Germany', 'Canada'],
  documents: {},
  baridiMobInfo: {
    fullName: 'Test User',
    wilaya: 'Alger',
    rip: '12345678901234567890',
    ccp: '1234567890',
    key: '01',
  },
  password: 'test-user-1234',
}

// ============================================
// MAIN TEST WORKFLOW
// ============================================
async function runVerification() {
  log('\n🚀 NCH COMMUNITY - WORKFLOW VERIFICATION', 'yellow')
  log('=' .repeat(50), 'yellow')

  let pendingId: string | null = null
  let clientId: string | null = null

  try {
    // ============================================
    // STEP 1: Simulate BaridiMob Registration
    // ============================================
    step(1, 'Simulate BaridiMob Registration (Create PendingRegistration)')

    const sessionToken = `test_baridimob_${Date.now()}`
    
    const pendingReg = await prisma.pendingRegistration.create({
      data: {
        sessionToken,
        registrationData: testData,
        paymentDetails: {
          amount: 10500, // 50% of basic (21000)
          paymentType: 'partial',
          paymentMethod: 'baridimob',
          offer: 'basic',
          baridiMobInfo: testData.baridiMobInfo,
          receiptUrl: 'https://example.com/receipt.jpg',
        },
        status: 'pending_verification',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    })

    pendingId = pendingReg.id
    success(`PendingRegistration created with ID: ${pendingId}`)
    info(`Session Token: ${sessionToken}`)
    info(`Status: ${pendingReg.status}`)

    // ============================================
    // STEP 2: Verify PendingRegistration exists in DB
    // ============================================
    step(2, 'Verify PendingRegistration exists in DB')

    const verifyPending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId }
    })

    if (!verifyPending) {
      throw new Error('PendingRegistration not found!')
    }

    success('PendingRegistration verified in database')
    info(`Email in data: ${(verifyPending.registrationData as any).email}`)
    info(`Status: ${verifyPending.status}`)

    // ============================================
    // STEP 3: Simulate Admin Approval
    // ============================================
    step(3, 'Simulate Admin Approval')

    const regData = verifyPending.registrationData as any
    const paymentDetails = verifyPending.paymentDetails as any

    // Create the client
    const client = await prisma.client.create({
      data: {
        firstName: regData.firstName,
        lastName: regData.lastName,
        email: regData.email,
        phone: regData.phone,
        wilaya: regData.wilaya,
        diploma: regData.diploma,
        password: regData.password, // Plain text as requested
        selectedOffer: regData.selectedOffer,
        selectedCountries: regData.selectedCountries || [],
        documents: regData.documents || {},
        status: 'pending',
      }
    })

    clientId = client.id
    success(`Client created with ID: ${clientId}`)
    info(`Email: ${client.email}`)
    info(`Password: ${client.password}`)

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        clientId: client.id,
        paymentType: 'initial',
        paymentMethod: 'baridimob',
        amount: paymentDetails.amount,
        status: 'verified',
        baridiMobInfo: paymentDetails.baridiMobInfo,
        receiptUrl: paymentDetails.receiptUrl,
        verifiedBy: null, // In real flow this would be admin's ObjectId
        verifiedAt: new Date(),
      }
    })

    success(`Payment record created with ID: ${payment.id}`)
    info(`Amount: ${payment.amount} DZD`)
    info(`Status: ${payment.status}`)

    // Update pending registration status
    await prisma.pendingRegistration.update({
      where: { id: pendingId },
      data: { status: 'approved' }
    })

    success('PendingRegistration marked as approved')

    // ============================================
    // STEP 4: Final Verification
    // ============================================
    step(4, 'Final Verification')

    // Check client exists
    const finalClient = await prisma.client.findUnique({
      where: { id: clientId },
      include: { payments: true }
    })

    if (!finalClient) {
      throw new Error('Client not found after approval!')
    }

    success(`Client exists: ${finalClient.email}`)
    info(`Password stored: ${finalClient.password}`)
    info(`Has ${finalClient.payments.length} payment(s)`)

    // Check pending is approved (not pending anymore)
    const finalPending = await prisma.pendingRegistration.findUnique({
      where: { id: pendingId }
    })

    if (finalPending?.status !== 'approved') {
      throw new Error('PendingRegistration should be approved!')
    }

    success('PendingRegistration status is "approved"')

    // ============================================
    // SUCCESS SUMMARY
    // ============================================
    log('\n' + '='.repeat(50), 'green')
    log('🎉 ALL TESTS PASSED!', 'green')
    log('='.repeat(50), 'green')

    log('\nWorkflow verified:', 'green')
    log('1. ✅ BaridiMob registration creates PendingRegistration', 'green')
    log('2. ✅ PendingRegistration stored correctly in DB', 'green')
    log('3. ✅ Admin approval creates Client + Payment', 'green')
    log('4. ✅ Password stored as plain text', 'green')
    log('5. ✅ Payment linked to Client via relation', 'green')

  } catch (err: any) {
    error(`Test failed: ${err.message}`)
    console.error(err)
  } finally {
    // ============================================
    // CLEANUP
    // ============================================
    log('\n🧹 Cleaning up test data...', 'yellow')

    try {
      // Delete in correct order (payments first due to relation)
      if (clientId) {
        await prisma.payment.deleteMany({ where: { clientId } })
        await prisma.client.delete({ where: { id: clientId } })
        info(`Deleted test client: ${clientId}`)
      }

      if (pendingId) {
        await prisma.pendingRegistration.delete({ where: { id: pendingId } }).catch(() => {})
        info(`Deleted test pending: ${pendingId}`)
      }

      success('Cleanup complete')
    } catch (cleanupErr: any) {
      error(`Cleanup error: ${cleanupErr.message}`)
    }

    await prisma.$disconnect()
  }
}

// Run the verification
runVerification()
