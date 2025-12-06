// lib/utils/pricing.ts

/**
 * Get the base amount for an offer
 */
export const getAmountByOffer = (offer: string): number => {
    switch (offer) {
        case 'basic': return 21000
        case 'premium': return 28000
        case 'gold': return 35000
        default: return 21000
    }
}

/**
 * Calculate payment amount based on offer and payment type
 */
export const calculatePaymentAmount = (offer: string, paymentType: 'full' | 'partial'): number => {
    const basePrice = getAmountByOffer(offer)
    
    if (paymentType === 'full') {
        // Full payment with 1000 DA discount
        return basePrice - 1000
    } else {
        // Partial payment: 50% upfront
        return basePrice * 0.5
    }
}

/**
 * Get offer name in French
 */
export const getOfferName = (offer: string): string => {
    switch (offer) {
        case 'basic': return 'Basique'
        case 'premium': return 'Premium'
        case 'gold': return 'Gold'
        default: return offer
    }
}
