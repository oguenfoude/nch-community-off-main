import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

/**
 * API Route: PATCH /api/clients/[id]/payment/[paymentId]/verify
 * 
 * Verifies a BaridiMob payment by changing status from 'paid' to 'verified'
 * This is used when admin manually verifies the payment receipt
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireAdmin()
    
    const { id, paymentId } = await params
    
    console.log(`🔍 Admin ${admin.id} verifying payment ${paymentId} for client ${id}`)
    
    // Get the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    })
    
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    
    if (payment.clientId !== id) {
      return NextResponse.json({ error: "Payment does not belong to this client" }, { status: 400 })
    }
    
    if (payment.status !== 'paid') {
      return NextResponse.json({ error: "Payment is not in 'paid' status" }, { status: 400 })
    }
    
    // Update payment to verified
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'verified',
        verifiedBy: admin.id,
        verifiedAt: new Date()
      }
    })
    
    // Fetch updated client with payments to return enriched data
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
    
    // Calculate updated payment status
    const payments = client.payments || []
    const totalPaid = payments.filter(p => p.status === 'verified' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    
    let paymentStatus = 'unpaid'
    if (totalPaid > 0 && totalPending === 0) {
      paymentStatus = 'paid'
    } else if (totalPaid > 0 && totalPending > 0) {
      paymentStatus = 'partially_paid'
    } else if (totalPending > 0) {
      paymentStatus = 'pending'
    }
    
    const enrichedClient = {
      ...client,
      paymentStatus,
      paymentMethod: payments[0]?.paymentMethod || null,
      totalAmount: totalPaid + totalPending,
      paidAmount: totalPaid,
      remainingAmount: totalPending
    }
    
    console.log(`✅ Payment ${paymentId} verified successfully`)
    
    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      client: enrichedClient
    })
    
  } catch (error: any) {
    console.error("PATCH /api/clients/[id]/payment/[paymentId]/verify error:", error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Payment or client not found" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
