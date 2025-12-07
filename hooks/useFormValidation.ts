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
    
    // Phone validation with strict format check
    if (!formData.phone.trim()) {
      sectionErrors.phone = t.errors.required
    } else {
      // Inline phone validation
      const cleanPhone = formData.phone.replace(/[\s\-\.\(\)]/g, '')
      if (!/^\+?[0-9]+$/.test(cleanPhone)) {
        sectionErrors.phone = language === 'fr' 
          ? "Le téléphone doit contenir uniquement des chiffres"
          : "يجب أن يحتوي الهاتف على أرقام فقط"
      } else if (!/^(0|\+213)[5-7][0-9]{8}$/.test(cleanPhone)) {
        sectionErrors.phone = t.errors.phone
      }
    }
    
    // Email validation with strict format check
    if (!formData.email.trim()) {
      sectionErrors.email = t.errors.required
    } else {
      // Inline email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(formData.email.trim())) {
        sectionErrors.email = language === 'fr'
          ? "Format d'email invalide (exemple: nom@email.com)"
          : "تنسيق البريد الإلكتروني غير صالح"
      }
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
    
    // Check required documents
    if (!pendingFiles.id) {
      sectionErrors.documents = language === 'fr'
        ? "Document d'identité requis"
        : "وثيقة الهوية مطلوبة"
    }
    if (!pendingFiles.diploma) {
      sectionErrors.documents = language === 'fr'
        ? "Diplôme requis"
        : "الشهادة مطلوبة"
    }
    if (!pendingFiles.photo) {
      sectionErrors.documents = language === 'fr'
        ? "Photo requise"
        : "الصورة مطلوبة"
    }
    
    // If all exist, validate file types and sizes
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (pendingFiles.id) {
      if (!allowedTypes.includes(pendingFiles.id.type)) {
        sectionErrors.documents = language === 'fr'
          ? "Format d'identité invalide (PDF, JPG, PNG uniquement)"
          : "تنسيق الهوية غير صالح (PDF, JPG, PNG فقط)"
      }
      if (pendingFiles.id.size > maxSize) {
        sectionErrors.documents = language === 'fr'
          ? "Fichier d'identité trop volumineux (max 10MB)"
          : "ملف الهوية كبير جداً (الحد الأقصى 10 ميغابايت)"
      }
    }
    
    if (pendingFiles.diploma) {
      if (!allowedTypes.includes(pendingFiles.diploma.type)) {
        sectionErrors.documents = language === 'fr'
          ? "Format de diplôme invalide (PDF, JPG, PNG uniquement)"
          : "تنسيق الشهادة غير صالح (PDF, JPG, PNG فقط)"
      }
      if (pendingFiles.diploma.size > maxSize) {
        sectionErrors.documents = language === 'fr'
          ? "Fichier de diplôme trop volumineux (max 10MB)"
          : "ملف الشهادة كبير جداً (الحد الأقصى 10 ميغابايت)"
      }
    }
    
    if (pendingFiles.photo) {
      if (!allowedTypes.includes(pendingFiles.photo.type)) {
        sectionErrors.documents = language === 'fr'
          ? "Format de photo invalide (PDF, JPG, PNG uniquement)"
          : "تنسيق الصورة غير صالح (PDF, JPG, PNG فقط)"
      }
      if (pendingFiles.photo.size > maxSize) {
        sectionErrors.documents = language === 'fr'
          ? "Fichier photo trop volumineux (max 10MB)"
          : "ملف الصورة كبير جداً (الحد الأقصى 10 ميغابايت)"
      }
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
        // Remove all spaces and special characters for validation
        const cleanPhone = value.replace(/[\s\-\.\(\)]/g, '')
        // Must contain only digits (and optional + at start)
        if (!/^\+?[0-9]+$/.test(cleanPhone)) {
          return language === 'fr' 
            ? "Le téléphone doit contenir uniquement des chiffres"
            : "يجب أن يحتوي الهاتف على أرقام فقط"
        }
        // Validation du format téléphone algérien (0XXXXXXXXX or +213XXXXXXXXX)
        if (!/^(0|\+213)[5-7][0-9]{8}$/.test(cleanPhone)) {
          return t.errors.phone
        }
        return undefined

      case 'email':
        if (!value || !value.trim()) return t.errors.required
        // Strict email validation: name@domain.ext
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(value.trim())) {
          return language === 'fr'
            ? "Format d'email invalide (exemple: nom@email.com)"
            : "تنسيق البريد الإلكتروني غير صالح"
        }
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