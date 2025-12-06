// components/common/LanguageToggle.tsx
import { Button } from '@/components/ui/button'
import { Language } from '@/lib/types/form'

interface LanguageToggleProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

export const LanguageToggle = ({ language, onLanguageChange }: LanguageToggleProps) => {
  const toggleLanguage = () => {
    onLanguageChange(language === 'fr' ? 'ar' : 'fr')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-lg font-semibold px-2 sm:px-3"
    >
      {language === 'fr' ? (
        <>
          <span className="text-sm sm:text-lg">🇩🇿</span>
          <span className="hidden sm:inline">العربية</span>
          <span className="sm:hidden">AR</span>
        </>
      ) : (
        <>
          <span className="text-sm sm:text-lg">🇫🇷</span>
          <span className="hidden sm:inline">Français</span>
          <span className="sm:hidden">FR</span>
        </>
      )}
    </Button>
  )
}