// lib/validators/registration.schema.ts
import { z } from 'zod'

// ============================================
// COMMON SCHEMAS
// ============================================

export const phoneSchema = z.string()
  .min(9, 'Le numéro de téléphone doit avoir au moins 9 chiffres')
  .max(15, 'Le numéro de téléphone est trop long')
  .regex(/^[0-9+\-\s()]+$/, 'Format de téléphone invalide')

export const emailSchema = z.string()
  .email('Format d\'email invalide')
  .transform(val => val.trim().toLowerCase())

// ============================================
// BARIDIMOB INFO SCHEMA
// ============================================

export const baridiMobInfoSchema = z.object({
  email: emailSchema,
  rip: z.string().regex(/^\d{20}$/, 'Le RIP doit contenir exactement 20 chiffres'),
  ccp: z.string().regex(/^\d+$/, 'Le CCP doit contenir uniquement des chiffres'),
  key: z.string().regex(/^\d{2}$/, 'La clé doit contenir exactement 2 chiffres'),
})

export type BaridiMobInfo = z.infer<typeof baridiMobInfoSchema>

// ============================================
// REGISTRATION SCHEMA
// ============================================

export const registrationSchema = z.object({
  // Required fields
  firstName: z.string().min(2, 'Prénom requis').max(50).transform(val => val.trim()),
  lastName: z.string().min(2, 'Nom requis').max(50).transform(val => val.trim()),
  email: emailSchema,
  phone: phoneSchema,
  wilaya: z.string().min(2, 'Wilaya requise'),
  diploma: z.string().min(2, 'Diplôme requis'),
  selectedOffer: z.enum(['basic', 'premium', 'gold'], {
    errorMap: () => ({ message: 'Offre invalide' })
  }),
  paymentMethod: z.enum(['cib', 'baridimob'], {
    errorMap: () => ({ message: 'Méthode de paiement invalide' })
  }),
  
  // Optional fields
  paymentType: z.enum(['full', 'partial']).default('partial'),
  selectedCountries: z.array(z.string()).default([]),
  documents: z.record(z.any()).default({}),
  
  // BaridiMob specific (required only if paymentMethod is baridimob)
  baridiMobInfo: baridiMobInfoSchema.optional(),
}).refine(
  (data) => {
    // If payment method is baridimob, baridiMobInfo is required
    if (data.paymentMethod === 'baridimob') {
      return data.baridiMobInfo !== undefined
    }
    return true
  },
  {
    message: 'Informations BaridiMob requises pour ce mode de paiement',
    path: ['baridiMobInfo'],
  }
)

export type RegistrationInput = z.infer<typeof registrationSchema>

// ============================================
// VALIDATION HELPER
// ============================================

export function validateRegistration(data: unknown): { 
  success: true; data: RegistrationInput 
} | { 
  success: false; errors: z.ZodError['errors'] 
} {
  const result = registrationSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error.errors }
}
