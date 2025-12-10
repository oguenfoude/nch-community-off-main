import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * API Route: PATCH /api/clients/[id]/payment-status
 * 
 * Allows admin to manually update a client's payment status by creating or updating Payment records.
 * This is essential for:
 * - Manual payment verification (BaridiMob receipts)
 * - Correcting payment status errors
 * - Marking payments as completed outside automated flow
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireAdmin()
    
    const { id } = await params
    const body = await request.json()
    
    const { paymentStatus } = body
    
    // Validate payment status
    const validStatuses = ['unpaid', 'pending', 'paid', 'partially_paid', 'failed', 'refunded']
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }
    
    console.log(`🔄 Admin ${admin.id} updating payment status for client ${id} to: ${paymentStatus}`)
    
    // Get client with payments
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    
    // Calculate the offer amount (this should match your payment logic)
    const offerAmounts: Record<string, number> = {
      basic: 25000,
      premium: 50000,
      gold: 75000,
    }
    
    const totalAmount = offerAmounts[client.selectedOffer] || 0
    
    // Handle different payment status updates
    let payment
    
    switch (paymentStatus) {
      case 'paid':
        // Mark all payments as verified or create a new verified payment
        if (client.payments.length > 0) {
          // Update existing payments to verified
          await prisma.payment.updateMany({
            where: {
              clientId: id,
              status: { in: ['pending', 'failed'] }
            },
            data: {
              status: 'verified',
              verifiedBy: admin.id,
              verifiedAt: new Date()
            }
          })
        } else {
          // Create a new verified payment for the full amount
          payment = await prisma.payment.create({
            data: {
              clientId: id,
              paymentType: 'initial',
              paymentMethod: 'manual', // Manual admin verification
              amount: totalAmount,
              status: 'verified',
              verifiedBy: admin.id,
              verifiedAt: new Date()
            }
          })
        }
        break
        
      case 'pending':
        // Create a pending payment if none exists
        if (client.payments.length === 0) {
          payment = await prisma.payment.create({
            data: {
              clientId: id,
              paymentType: 'initial',
              paymentMethod: 'pending',
              amount: totalAmount,
              status: 'pending'
            }
          })
        } else {
          // Update existing payments to pending
          await prisma.payment.updateMany({
            where: {
              clientId: id,
              status: { in: ['verified', 'failed'] }
            },
            data: {
              status: 'pending'
            }
          })
        }
        break
        
      case 'unpaid':
        // Delete all payments or mark as failed
        await prisma.payment.deleteMany({
          where: { clientId: id }
        })
        break
        
      case 'partially_paid':
        // Ensure there's at least one verified payment and one pending
        const verifiedPayment = client.payments.find(p => p.status === 'verified')
        const pendingPayment = client.payments.find(p => p.status === 'pending')
        
        if (!verifiedPayment) {
          // Create a verified payment for 50% of the amount
          await prisma.payment.create({
            data: {
              clientId: id,
              paymentType: 'initial',
              paymentMethod: 'manual',
              amount: totalAmount / 2,
              status: 'verified',
              verifiedBy: admin.id,
              verifiedAt: new Date()
            }
          })
        }
        
        if (!pendingPayment) {
          // Create a pending payment for the remaining amount
          await prisma.payment.create({
            data: {
              clientId: id,
              paymentType: 'second',
              paymentMethod: 'pending',
              amount: totalAmount / 2,
              status: 'pending'
            }
          })
        }
        break
        
      case 'failed':
        // Mark all payments as failed
        await prisma.payment.updateMany({
          where: { clientId: id },
          data: { status: 'failed' }
        })
        break
        
      case 'refunded':
        // Create a refund payment record (negative amount)
        payment = await prisma.payment.create({
          data: {
            clientId: id,
            paymentType: 'initial',
            paymentMethod: 'refund',
            amount: -totalAmount,
            status: 'verified',
            verifiedBy: admin.id,
            verifiedAt: new Date()
          }
        })
        break
    }
    
    // Fetch updated client with payments
    const updatedClient = await prisma.client.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    // Calculate the updated payment status
    const payments = updatedClient?.payments || []
    const totalPaid = payments.filter(p => p.status === 'verified' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    
    let calculatedPaymentStatus = 'unpaid'
    if (totalPaid > 0 && totalPending === 0) {
      calculatedPaymentStatus = 'paid'
    } else if (totalPaid > 0 && totalPending > 0) {
      calculatedPaymentStatus = 'partially_paid'
    } else if (totalPending > 0) {
      calculatedPaymentStatus = 'pending'
    }
    
    const enrichedClient = {
      ...updatedClient,
      paymentStatus: calculatedPaymentStatus,
      paymentMethod: payments[0]?.paymentMethod || null,
      totalAmount: totalPaid + totalPending,
      paidAmount: totalPaid,
      remainingAmount: totalPending
    }
    
    console.log(`✅ Payment status updated for client ${id}: ${calculatedPaymentStatus}`)
    
    return NextResponse.json(enrichedClient)
    
  } catch (error: any) {
    console.error("PATCH /api/clients/[id]/payment-status error:", error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
