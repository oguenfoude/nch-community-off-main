// app/api/admin/approve-registration/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { 
  approveBaridiMobRegistration, 
  rejectPendingRegistration,
  getPendingBaridiMobRegistrations 
} from '@/lib/services/registration.service'
import { approveRegistrationSchema } from '@/lib/validators/payment.schema'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// ============================================
// GET - List all pending BaridiMob registrations
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request)
    
    const pendingRegistrations = await getPendingBaridiMobRegistrations()
    
    // Format for admin view
    const formatted = pendingRegistrations.map(reg => {
      const regData = reg.registrationData as any
      const paymentDetails = reg.paymentDetails as any
      
      return {
        id: reg.id,
        sessionToken: reg.sessionToken,
        status: reg.status,
        createdAt: reg.createdAt,
        expiresAt: reg.expiresAt,
        client: {
          firstName: regData.firstName,
          lastName: regData.lastName,
          email: regData.email,
          phone: regData.phone,
          wilaya: regData.wilaya,
          selectedOffer: regData.selectedOffer,
        },
        payment: {
          amount: paymentDetails?.amount,
          paymentMethod: 'baridimob',
          baridiMobInfo: paymentDetails?.baridiMobInfo,
          receiptUrl: paymentDetails?.receiptUrl,
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      count: formatted.length,
      registrations: formatted,
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching pending registrations:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Approve or Reject a pending registration
// ============================================
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request)
    // Get admin ID - must be a valid ObjectId or null
    const adminId = (session as any).user?.id || null
    
    const body = await request.json()
    
    // Validate input
    const validation = approveRegistrationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          errors: validation.error.errors 
        },
        { status: 400 }
      )
    }
    
    const { pendingId, action, rejectionReason } = validation.data
    
    // Handle approval
    if (action === 'approve') {
      const result = await approveBaridiMobRegistration(pendingId, adminId)
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Inscription approuvée avec succès',
        clientId: result.clientId,
        credentials: result.credentials,
      })
    }
    
    // Handle rejection
    if (action === 'reject') {
      const result = await rejectPendingRegistration(pendingId, rejectionReason || 'Rejeté par admin')
      
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Inscription rejetée',
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Action invalide' },
      { status: 400 }
    )
    
  } catch (error: any) {
    console.error('❌ Error processing registration:', error)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
