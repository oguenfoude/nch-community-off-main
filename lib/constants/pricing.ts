// lib/constants/pricing.ts
// ============================================
// SINGLE SOURCE OF TRUTH FOR ALL PRICING
// ============================================

export const PRICING = {
  basic: {
    total: 21000,
    initial: 10500,  // 50% upfront
    second: 10500,   // 50% remaining
    fullDiscount: 1000, // Discount for full payment
  },
  premium: {
    total: 28000,
    initial: 14000,
    second: 14000,
    fullDiscount: 1000,
  },
  gold: {
    total: 35000,
    initial: 17500,
    second: 17500,
    fullDiscount: 1000,
  },
} as const

export type OfferType = keyof typeof PRICING

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get pricing for an offer
 */
export function getOfferPricing(offer: string) {
  const key = offer.toLowerCase() as OfferType
  return PRICING[key] || PRICING.basic
}

/**
 * Get total price for an offer
 */
export function getTotalPrice(offer: string): number {
  return getOfferPricing(offer).total
}

/**
 * Get initial payment amount (50%)
 */
export function getInitialPaymentAmount(offer: string): number {
  return getOfferPricing(offer).initial
}

/**
 * Get second payment amount (remaining 50%)
 */
export function getSecondPaymentAmount(offer: string): number {
  return getOfferPricing(offer).second
}

/**
 * Calculate payment amount based on offer and payment type
 */
export function calculatePaymentAmount(offer: string, paymentType: 'full' | 'partial'): number {
  const pricing = getOfferPricing(offer)
  
  if (paymentType === 'full') {
    // Full payment with discount
    return pricing.total - pricing.fullDiscount
  }
  
  // Partial payment: 50% upfront
  return pricing.initial
}

/**
 * Get remaining amount after initial payment
 */
export function getRemainingAmount(offer: string, paymentType: 'full' | 'partial'): number {
  if (paymentType === 'full') {
    return 0
  }
  return getOfferPricing(offer).second
}

/**
 * Get offer display name in French
 */
export function getOfferDisplayName(offer: string): string {
  const names: Record<string, string> = {
    basic: 'Basique',
    premium: 'Premium',
    gold: 'Gold',
  }
  return names[offer.toLowerCase()] || offer
}
