// hooks/useFormValidation.ts
import { useState } from 'react'
import { FormData } from '@/lib/types/form'

// Define FormErrors type if not exported from '@/lib/types/form'
type FormErrors = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  wilaya?: string
  diploma?: string
  selectedCountries?: string // ✅ Ajouté
  documents?: string
  selectedOffer?: string
  paymentMethod?: string
}
import { translations } from '@/lib/translations'

export const useFormValidation = (language: 'fr' | 'ar') => {
  const [errors, setErrors] = useState<FormErrors>({})
  const t = translations[language]

  const validateStep = (step: number, formData: FormData): boolean => {
    const newErrors: FormErrors = {}

    switch (step) {
      case 0:
        // Validation des champs existants
        if (!formData.firstName.trim()) newErrors.firstName = t.errors.required
        if (!formData.lastName.trim()) newErrors.lastName = t.errors.required
        if (!formData.phone.trim()) newErrors.phone = t.errors.required
        if (!formData.email.trim()) {
          newErrors.email = t.errors.required
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = t.errors.email
        }
        if (!formData.wilaya) newErrors.wilaya = t.errors.required
        if (!formData.diploma) newErrors.diploma = t.errors.required

        // ✅ Validation pour selectedCountries - OBLIGATOIRE
        if (!formData.selectedCountries || formData.selectedCountries.length === 0) {
          newErrors.selectedCountries = t.errors.required
        } else {
          // Vérifier que chaque pays n'est pas vide après nettoyage
          const hasEmptyCountry = formData.selectedCountries.some(country => !country.trim())
          if (hasEmptyCountry) {
            newErrors.selectedCountries = language === 'fr'
              ? "Veuillez saisir des noms de pays valides"
              : "يرجى إدخال أسماء بلدان صحيحة"
          }

          // Limite optionnelle sur le nombre de pays
          if (formData.selectedCountries.length > 10) {
            newErrors.selectedCountries = language === 'fr'
              ? "Maximum 10 pays autorisés"
              : "الحد الأقصى 10 بلدان مسموح"
          }

          // Vérifier que chaque pays a au moins 2 caractères
          const hasShortCountry = formData.selectedCountries.some(country => country.trim().length < 2)
          if (hasShortCountry) {
            newErrors.selectedCountries = language === 'fr'
              ? "Chaque nom de pays doit contenir au moins 2 caractères"
              : "يجب أن يحتوي اسم كل بلد على حرفين على الأقل"
          }

          // Vérifier les doublons
          const countryNames = formData.selectedCountries.map(country => country.trim().toLowerCase())
          const uniqueCountries = new Set(countryNames)
          if (countryNames.length !== uniqueCountries.size) {
            newErrors.selectedCountries = language === 'fr'
              ? "Veuillez éviter les pays en double"
              : "يرجى تجنب تكرار البلدان"
          }
        }
        break

      case 1:
        if (!formData.documents.id || !formData.documents.diploma ||
           !formData.documents.photo) {
          newErrors.documents = t.errors.documents
        }
        break

      case 2:
        if (!formData.selectedOffer) newErrors.selectedOffer = t.errors.offer
        break

      case 3:
        if (!formData.paymentType) {newErrors.paymentType = language === 'fr' ? "Veuillez choisir un mode de paiement": "يرجى اختيار طريقة الدفع"}
        if (!formData.paymentMethod) newErrors.paymentMethod = t.errors.payment
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
    validateAndCleanCountries
  }
}