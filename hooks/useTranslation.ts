// hooks/useTranslation.ts
import { translations } from '@/lib/translations'
import { Language } from '@/lib/types/form'

export const useTranslation = (language: Language) => {
  return translations[language]
}