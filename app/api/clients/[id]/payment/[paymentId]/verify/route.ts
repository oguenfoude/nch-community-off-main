import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { syncPaymentVerification } from "@/lib/services/googleSheets.sync"

/**
 * API Route: PATCH /api/clients/[id]/payment/[paymentId]/verify
 * 
 * ADMIN ACTION: Accept or reject a BaridiMob payment
 * - Accept: Changes status from 'pending' or 'paid' to 'verified' 
 * - Reject: Changes status from 'pending' or 'paid' to 'rejected'
 * This is used when admin manually reviews the payment receipt
 * 
 * Note: Initial payments have status 'paid', second payments have status 'pending'
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireAdmin()
    
    const { id, paymentId } = await params
    const body = await request.json()
    const { action, reason } = body // action: 'accept' | 'reject', reason: optional rejection reason
    
    console.log(`🔍 Admin ${admin.id} reviewing payment ${paymentId} for client ${id} - Action: ${action}`)
    
    // Validate action
    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Action must be 'accept' or 'reject'" }, { status: 400 })
    }
    
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
    
    // Allow verification of both 'pending' and 'paid' payments (pending=second payment, paid=initial payment)
    if (payment.status !== 'paid' && payment.status !== 'pending') {
      return NextResponse.json({ 
        error: `Payment cannot be verified. Current status: ${payment.status}. Only 'pending' or 'paid' payments can be verified.` 
      }, { status: 400 })
    }
    
    // Update payment based on admin action
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: action === 'accept' ? 'verified' : 'rejected',
        verifiedBy: admin.id,
        verifiedAt: new Date(),
        ...(action === 'reject' && reason ? { rejectionReason: reason } : {})
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
    
    console.log(`✅ Payment ${action}ed successfully:`, paymentId)
    console.log(`📊 Updated payment status: ${paymentStatus}`)
    
    // 🔄 Sync to Google Sheets with history
    try {
      await syncPaymentVerification(id, paymentId, action, admin.id, reason)
      console.log('✅ Payment verification synced to Google Sheets')
    } catch (error: any) {
      console.error('⚠️ Google Sheets sync failed (non-blocking):', error.message)
    }
    
    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      client: enrichedClient,
      message: action === 'accept' ? 'Paiement accepté avec succès' : 'Paiement rejeté'
    })
    
  } catch (error: any) {
    console.error("PATCH /api/clients/[id]/payment/[paymentId]/verify error:", error)
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Payment or client not found" }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
