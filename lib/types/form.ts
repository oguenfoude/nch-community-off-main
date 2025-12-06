// lib/types/form.ts
export interface UploadedFile {
  fileId: string
  url: string
  downloadUrl: string
  name: string
  size: string
  type: string
}

export interface BaridiMobInfo {
  fullName: string
  wilaya: string
  rip: string
  ccp: string
  key: string
}

export interface FormData {
  firstName: string
  lastName: string
  phone: string
  email: string
  wilaya: string
  diploma: string
  selectedCountries: string[]
  selectedOffer: string
  paymentMethod: string
  paymentType?: PaymentType
  paymentReceipt?: UploadedFile | null
  baridiMobInfo?: BaridiMobInfo // ✅ BaridiMob account info

  documents: {
    id: UploadedFile | null
    diploma: UploadedFile | null
    workCertificate: UploadedFile | null
    photo: UploadedFile | null
  }
}

export type DocumentType = 'id' | 'diploma' | 'workCertificate' | 'photo'
export type Language = 'fr' | 'ar'
export type PaymentMethod = 'cib' | 'edahabia' | 'baridimob'
export type PaymentType = 'full' | 'partial'

// ✅ NEW: Pending files before upload (raw File objects)
export interface PendingFiles {
  id: File | null
  diploma: File | null
  workCertificate: File | null
  photo: File | null
  paymentReceipt: File | null  // ✅ Added: Payment receipt for BaridiMob
}

// ✅ NEW: Section status for UI indicators
export type SectionStatus = 'complete' | 'incomplete' | 'error'

export interface SectionValidation {
  basicInfo: SectionStatus
  documents: SectionStatus
  offers: SectionStatus
  payment: SectionStatus
}

export interface FormErrors {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  wilaya?: string
  diploma?: string
  selectedCountries?: string
  documents?: string
  selectedOffer?: string
  paymentMethod?: string
  paymentType?: string
  paymentReceipt?: string
  baridiMobInfo?: string // ✅ NEW: BaridiMob validation error
}