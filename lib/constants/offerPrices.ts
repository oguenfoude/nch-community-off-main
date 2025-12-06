// lib/constants/offerPrices.ts
export const OFFER_PRICES = {
  basic: 50000,      // 50,000 DZD - Update with real price
  premium: 100000,   // 100,000 DZD - Update with real price
  gold: 150000       // 150,000 DZD - Update with real price
} as const

export type OfferType = keyof typeof OFFER_PRICES

export function getOfferPrice(offer: string): number {
  return OFFER_PRICES[offer as OfferType] || OFFER_PRICES.basic
}

export function calculatePartialPayment(offer: string): number {
  return getOfferPrice(offer) * 0.5
}