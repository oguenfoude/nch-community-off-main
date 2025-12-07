// app/api/register/route.ts
// ============================================
// REFACTORED: Uses service layer for clean separation
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { validateRegistration } from '@/lib/validators/registration.schema'
import { 
  registerWithCardPayment, 
  registerWithBaridiMob 
} from '@/lib/services/registration.service'
import { getRemainingAmount } from '@/lib/constants/pricing'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Registration request received...')
    
    const body = await request.json()
    console.log('📦 Request body:', JSON.stringify(body, null, 2))

    // ============================================
    // 1. VALIDATE INPUT
    // ============================================
    const validation = validateRegistration(body)
    
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.errors)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          errors: validation.errors 
        },
        { status: 400 }
      )
    }

    const data = validation.data
    console.log('✅ Validation passed for:', data.email)

    // ============================================
    // 2. ROUTE TO APPROPRIATE SERVICE
    // ============================================
    
    // CIB or Edahabia -> Card payment flow
    if (data.paymentMethod === 'cib' || data.paymentMethod === 'edahabia') {
      console.log('💳 Processing card payment...')
      
      const result = await registerWithCardPayment(data)
      
      if (!result.success) {
        console.log('❌ Card payment failed:', result.error)
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      console.log('✅ Payment initiated, redirecting to:', result.paymentUrl)
      
      return NextResponse.json({
        success: true,
        paymentRequired: true,
        paymentUrl: result.paymentUrl,
        message: 'Redirection vers le paiement...',
        paymentInfo: {
          remainingAmount: getRemainingAmount(data.selectedOffer, data.paymentType),
          paymentType: data.paymentType,
        },
        credentials: result.credentials,
      })
    }

    // BaridiMob -> Manual verification flow
    if (data.paymentMethod === 'baridimob') {
      console.log('📱 Processing BaridiMob registration...')
      
      const result = await registerWithBaridiMob(data)
      
      if (!result.success) {
        console.log('❌ BaridiMob registration failed:', result.error)
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        )
      }

      console.log('✅ BaridiMob registration created, pending verification')
      
      return NextResponse.json({
        success: true,
        message: 'Inscription enregistrée. En attente de vérification du paiement.',
        pendingId: result.pendingId,
        credentials: result.credentials,
      }, { status: 201 })
    }

    // Unknown payment method
    return NextResponse.json(
      { success: false, error: 'Méthode de paiement non supportée' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('❌ Registration error:', error)

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Un compte avec cet email existe déjà',
          errorCode: 'EMAIL_EXISTS'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de l\'inscription',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
