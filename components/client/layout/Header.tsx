// components/layout/Header.tsx
import { LanguageToggle } from '@/components/common/LanguageToggle'
import { Language } from '@/lib/types/form'
import { Button } from '@/components/ui/button'
import { LogIn, User } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  title: string
  language: Language
  onLanguageChange: (lang: Language) => void
}

export const Header = ({ title, language, onLanguageChange }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
        {/* Logo et titre */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img
            src="/images/nch-logo.jpg"
            alt="NCH Community Logo"
            className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
          />
          <span className="text-lg sm:text-xl font-bold text-nch-primary truncate">
            {title}
          </span>
        </div>

        {/* Contrôles droite */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Bouton de connexion - Version mobile */}
          <Link href="/login" className="sm:hidden">
            <Button
              variant="outline"
              size="sm"
              className="border-nch-primary text-nch-primary hover:bg-nch-primary hover:text-white transition-colors"
            >
              <User className="h-4 w-4" />
            </Button>
          </Link>

          {/* Bouton de connexion - Version desktop */}
          <Link href="/login" className="hidden sm:block">
            <Button
              variant="outline"
              className="border-nch-primary text-nch-primary hover:bg-nch-primary hover:text-white transition-colors"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
          </Link>

          {/* Sélecteur de langue */}
          <LanguageToggle
            language={language}
            onLanguageChange={onLanguageChange}
          />
        </div>
      </div>
    </header>
  )
}