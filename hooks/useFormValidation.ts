// hooks/useFormValidation.ts
import { useState } from 'react'
import { FormData, PendingFiles, SectionStatus, SectionValidation } from '@/lib/types/form'

// Define FormErrors type if not exported from '@/lib/types/form'
type FormErrors = {
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
  paymentReceipt?: string // ✅ Added for BaridiMob receipt validation
}
import { translations } from '@/lib/translations'

export const useFormValidation = (language: 'fr' | 'ar') => {
  const [errors, setErrors] = useState<FormErrors>({})
  const t = translations[language]

  // ✅ Validate basic info section (step 0)
  const validateBasicInfo = (formData: FormData): FormErrors => {
    const sectionErrors: FormErrors = {}

    if (!formData.firstName.trim()) sectionErrors.firstName = t.errors.required
    if (!formData.lastName.trim()) sectionErrors.lastName = t.errors.required
    if (!formData.phone.trim()) sectionErrors.phone = t.errors.required
    if (!formData.email.trim()) {
      sectionErrors.email = t.errors.required
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      sectionErrors.email = t.errors.email
    }
    if (!formData.wilaya) sectionErrors.wilaya = t.errors.required
    if (!formData.diploma) sectionErrors.diploma = t.errors.required

    // ✅ Validation pour selectedCountries - OBLIGATOIRE
    if (!formData.selectedCountries || formData.selectedCountries.length === 0) {
      sectionErrors.selectedCountries = t.errors.required
    } else {
      const hasEmptyCountry = formData.selectedCountries.some(country => !country.trim())
      if (hasEmptyCountry) {
        sectionErrors.selectedCountries = language === 'fr'
          ? "Veuillez saisir des noms de pays valides"
          : "يرجى إدخال أسماء بلدان صحيحة"
      }

      if (formData.selectedCountries.length > 10) {
        sectionErrors.selectedCountries = language === 'fr'
          ? "Maximum 10 pays autorisés"
          : "الحد الأقصى 10 بلدان مسموح"
      }

      const hasShortCountry = formData.selectedCountries.some(country => country.trim().length < 2)
      if (hasShortCountry) {
        sectionErrors.selectedCountries = language === 'fr'
          ? "Chaque nom de pays doit contenir au moins 2 caractères"
          : "يجب أن يحتوي اسم كل بلد على حرفين على الأقل"
      }

      const countryNames = formData.selectedCountries.map(country => country.trim().toLowerCase())
      const uniqueCountries = new Set(countryNames)
      if (countryNames.length !== uniqueCountries.size) {
        sectionErrors.selectedCountries = language === 'fr'
          ? "Veuillez éviter les pays en double"
          : "يرجى تجنب تكرار البلدان"
      }
    }

    return sectionErrors
  }

  // ✅ Validate documents section (step 1) - for DEFERRED mode with PendingFiles
  const validateDocuments = (pendingFiles: PendingFiles): FormErrors => {
    const sectionErrors: FormErrors = {}
    
    if (!pendingFiles.id || !pendingFiles.diploma || !pendingFiles.photo) {
      sectionErrors.documents = t.errors.documents
    }
    
    return sectionErrors
  }

  // ✅ Validate documents section (step 1) - for IMMEDIATE mode with FormData
  const validateDocumentsImmediate = (formData: FormData): FormErrors => {
    const sectionErrors: FormErrors = {}
    
    if (!formData.documents.id || !formData.documents.diploma || !formData.documents.photo) {
      sectionErrors.documents = t.errors.documents
    }
    
    return sectionErrors
  }

  // ✅ Validate offers section (step 2)
  const validateOffers = (formData: FormData): FormErrors => {
    const sectionErrors: FormErrors = {}
    
    if (!formData.selectedOffer) sectionErrors.selectedOffer = t.errors.offer
    
    return sectionErrors
  }

  // ✅ Validate payment section (step 3)
  const validatePayment = (formData: FormData, pendingFiles?: PendingFiles): FormErrors => {
    const sectionErrors: FormErrors = {}
    
    if (!formData.paymentType) {
      sectionErrors.paymentType = language === 'fr' 
        ? "Veuillez choisir un montant de paiement"
        : "يرجى اختيار مبلغ الدفع"
    }
    if (!formData.paymentMethod) {
      sectionErrors.paymentMethod = t.errors.payment
    }
    
    // For BaridiMob, require payment receipt
    if (formData.paymentMethod === 'baridimob') {
      const hasReceipt = pendingFiles?.paymentReceipt || formData.paymentReceipt
      if (!hasReceipt) {
        sectionErrors.paymentReceipt = language === 'fr'
          ? "Veuillez télécharger le reçu de paiement"
          : "يرجى تحميل إيصال الدفع"
      }
    }
    
    return sectionErrors
  }

  // ✅ NEW: Validate ALL sections at once (for single-page form)
  const validateAll = (formData: FormData, pendingFiles?: PendingFiles): { 
    isValid: boolean, 
    allErrors: FormErrors 
  } => {
    const basicInfoErrors = validateBasicInfo(formData)
    const documentsErrors = pendingFiles 
      ? validateDocuments(pendingFiles)
      : validateDocumentsImmediate(formData)
    const offersErrors = validateOffers(formData)
    const paymentErrors = validatePayment(formData, pendingFiles)

    const allErrors = {
      ...basicInfoErrors,
      ...documentsErrors,
      ...offersErrors,
      ...paymentErrors
    }

    setErrors(allErrors)
    return {
      isValid: Object.keys(allErrors).length === 0,
      allErrors
    }
  }

  // ✅ NEW: Get section status for UI indicators
  const getSectionStatus = (formData: FormData, pendingFiles?: PendingFiles): SectionValidation => {
    const getStatus = (sectionErrors: FormErrors): SectionStatus => {
      return Object.keys(sectionErrors).length === 0 ? 'complete' : 'incomplete'
    }

    const basicInfoErrors = validateBasicInfo(formData)
    const documentsErrors = pendingFiles 
      ? validateDocuments(pendingFiles)
      : validateDocumentsImmediate(formData)
    const offersErrors = validateOffers(formData)
    const paymentErrors = validatePayment(formData)

    return {
      basicInfo: getStatus(basicInfoErrors),
      documents: getStatus(documentsErrors),
      offers: getStatus(offersErrors),
      payment: getStatus(paymentErrors)
    }
  }

  const validateStep = (step: number, formData: FormData): boolean => {
    let newErrors: FormErrors = {}

    switch (step) {
      case 0:
        newErrors = validateBasicInfo(formData)
        break
      case 1:
        newErrors = validateDocumentsImmediate(formData)
        break
      case 2:
        newErrors = validateOffers(formData)
        break
      case 3:
        newErrors = validatePayment(formData)
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ✅ Fonction utilitaire pour valider un seul champ (optionnel)
  const validateField = (fieldName: keyof FormErrors, value: any): string | undefined => {
    switch (fieldName) {
      case 'firstName':
      case 'lastName':
      case 'wilaya':
      case 'diploma':
        return !value || !value.trim() ? t.errors.required : undefined

      case 'phone':
        if (!value || !value.trim()) return t.errors.required
        // Validation du format téléphone algérien (optionnel)
        if (!/^(0|\+213)[5-7][0-9]{8}$/.test(value.replace(/\s/g, ''))) {
          return t.errors.phone
        }
        return undefined

      case 'email':
        if (!value || !value.trim()) return t.errors.required
        if (!/\S+@\S+\.\S+/.test(value)) return t.errors.email
        return undefined

      case 'selectedCountries':
        // ✅ OBLIGATOIRE - Ne peut pas être vide
        if (!value || !Array.isArray(value) || value.length === 0) {
          return t.errors.required
        }

        const hasEmptyCountry = value.some((country: string) => !country.trim())
        if (hasEmptyCountry) {
          return language === 'fr'
            ? "Veuillez saisir des noms de pays valides"
            : "يرجى إدخال أسماء بلدان صحيحة"
        }

        if (value.length > 10) {
          return language === 'fr'
            ? "Maximum 10 pays autorisés"
            : "الحد الأقصى 10 بلدان مسموح"
        }

        const hasShortCountry = value.some((country: string) => country.trim().length < 2)
        if (hasShortCountry) {
          return language === 'fr'
            ? "Chaque nom de pays doit contenir au moins 2 caractères"
            : "يجب أن يحتوي اسم كل بلد على حرفين على الأقل"
        }

        const countryNames = value.map((country: string) => country.trim().toLowerCase())
        const uniqueCountries = new Set(countryNames)
        if (countryNames.length !== uniqueCountries.size) {
          return language === 'fr'
            ? "Veuillez éviter les pays en double"
            : "يرجى تجنب تكرار البلدان"
        }

        return undefined

      default:
        return undefined
    }
  }

  // ✅ Fonction pour nettoyer et valider les pays
  const validateAndCleanCountries = (countriesString: string): {
    isValid: boolean,
    countries: string[],
    error?: string
  } => {
    // ✅ Si vide, c'est une erreur maintenant
    if (!countriesString.trim()) {
      return {
        isValid: false,
        countries: [],
        error: t.errors.required
      }
    }

    const countries = countriesString
      .split(',')
      .map(country => country.trim())
      .filter(country => country.length > 0)

    // ✅ Si après nettoyage, il n'y a plus de pays valides
    if (countries.length === 0) {
      return {
        isValid: false,
        countries: [],
        error: t.errors.required
      }
    }

    // Appliquer la validation
    const error = validateField('selectedCountries', countries)

    return {
      isValid: !error,
      countries,
      error
    }
  }

  return {
    errors,
    setErrors,
    validateStep,
    validateField,
    validateAndCleanCountries,
    validateAll,
    getSectionStatus
  }
}