// lib/validators/payment.schema.ts
import { z } from 'zod'

// ============================================
// PAYMENT APPROVAL SCHEMA (Admin)
// ============================================

export const approveRegistrationSchema = z.object({
  pendingId: z.string().min(1, 'ID de l\'inscription requis'),
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
}).refine(
  (data) => {
    // If rejecting, reason should be provided
    if (data.action === 'reject' && !data.rejectionReason) {
      return false
    }
    return true
  },
  {
    message: 'Raison du rejet requise',
    path: ['rejectionReason'],
  }
)

export type ApproveRegistrationInput = z.infer<typeof approveRegistrationSchema>

// ============================================
// PAYMENT CALLBACK SCHEMA (SofizPay)
// ============================================

export const paymentCallbackSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  payment_status: z.string(),
  transaction_id: z.string().optional(),
  amount: z.string().optional(),
  signature: z.string().optional(),
  message: z.string().optional(),
})

export type PaymentCallbackInput = z.infer<typeof paymentCallbackSchema>

// ============================================
// SECOND PAYMENT SCHEMA
// ============================================

export const secondPaymentSchema = z.object({
  clientId: z.string().min(1, 'ID client requis'),
  paymentMethod: z.enum(['cib', 'edahabia']),
})

export type SecondPaymentInput = z.infer<typeof secondPaymentSchema>
