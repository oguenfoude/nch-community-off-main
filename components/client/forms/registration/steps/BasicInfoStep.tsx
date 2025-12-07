// components/forms/registration/steps/BasicInfoStep.tsx
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, X, GraduationCap, Globe } from 'lucide-react'
import { FormData, FormErrors } from '@/lib/types/form'
import { WILAYAS } from '@/lib/constants'

interface BasicInfoStepProps {
  formData: FormData
  errors: FormErrors
  translations: any
  onChange: (data: Partial<FormData>) => void
}

export const BasicInfoStep = ({ formData, errors, translations: t, onChange }: BasicInfoStepProps) => {
  // ✅ États pour la gestion des pays
  const [newCountry, setNewCountry] = useState("")
  const [countryError, setCountryError] = useState("")

  // ✅ Fonction pour ajouter un pays
  const addCountry = () => {
    const country = newCountry.trim()

    if (!country) {
      setCountryError(t.form.errors.countryRequired || "Veuillez saisir un nom de pays")
      return
    }

    if (country.length < 2) {
      setCountryError(t.form.errors.countryTooShort || "Le nom du pays doit contenir au moins 2 caractères")
      return
    }

    // Vérifier les doublons (insensible à la casse)
    const currentCountries = formData.selectedCountries || []
    const isDuplicate = currentCountries.some(
      c => c.toLowerCase() === country.toLowerCase()
    )

    if (isDuplicate) {
      setCountryError(t.form.errors.countryDuplicate || "Ce pays est déjà dans la liste")
      return
    }

    // Ajouter le pays
    onChange({
      selectedCountries: [...currentCountries, country]
    })
    setNewCountry("")
    setCountryError("")
  }

  // ✅ Fonction pour supprimer un pays
  const removeCountry = (countryToRemove: string) => {
    const currentCountries = formData.selectedCountries || []
    onChange({
      selectedCountries: currentCountries.filter(country => country !== countryToRemove)
    })
    setCountryError("")
  }

  // ✅ Gestion de l'ajout par touche Entrée
  const handleCountryKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCountry()
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <div className="space-y-2">
        <Label htmlFor="firstName" className="font-medium text-sm">
          {t.form.firstName}
        </Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          placeholder={t.form.placeholders.firstName}
          className={`h-10 sm:h-12 text-base sm:text-lg ${errors.firstName ? "border-red-500" : ""}`}
        />
        {errors.firstName && <p className="text-red-500 text-xs sm:text-sm">{errors.firstName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName" className="font-medium text-sm">
          {t.form.lastName}
        </Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          placeholder={t.form.placeholders.lastName}
          className={`h-10 sm:h-12 text-base sm:text-lg ${errors.lastName ? "border-red-500" : ""}`}
        />
        {errors.lastName && <p className="text-red-500 text-xs sm:text-sm">{errors.lastName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="font-medium text-sm">
          {t.form.phone}
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder={t.form.placeholders.phone}
          className={`h-10 sm:h-12 text-base sm:text-lg ${errors.phone ? "border-red-500" : ""}`}
        />
        {errors.phone && <p className="text-red-500 text-xs sm:text-sm">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-medium text-sm">
          {t.form.email}
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder={t.form.placeholders.email}
          className={`h-10 sm:h-12 text-base sm:text-lg ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && <p className="text-red-500 text-xs sm:text-sm">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="wilaya" className="font-medium text-sm">
          {t.form.wilaya}
        </Label>
        <Select
          value={formData.wilaya}
          onValueChange={(value) => onChange({ wilaya: value })}
        >
          <SelectTrigger className={`h-10 sm:h-12 ${errors.wilaya ? "border-red-500" : ""}`}>
            <SelectValue placeholder={t.form.placeholders.wilaya} />
          </SelectTrigger>
          <SelectContent>
            {WILAYAS.map((wilaya) => (
              <SelectItem key={wilaya} value={wilaya}>
                {wilaya}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.wilaya && <p className="text-red-500 text-xs sm:text-sm">{errors.wilaya}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="diploma" className="font-semibold text-base sm:text-lg flex items-center gap-2">
          <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4" />
          {t.form.diploma}
        </Label>
        <Input
          id="diploma"
          type="text"
          value={formData.diploma}
          onChange={(e) => onChange({ diploma: e.target.value })}
          placeholder={t.form.placeholders.diploma}
          className={`h-10 sm:h-12 text-base sm:text-lg ${errors.diploma ? "border-red-500" : ""}`}
        />
        {errors.diploma && <p className="text-red-500 text-xs sm:text-sm">{errors.diploma}</p>}
      </div>

      {/* ✅ NOUVEAU : Section avancée pour les pays de destination */}
      <div className="space-y-3 sm:col-span-2 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
        <div>
          <Label className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600" />
            {t.form.selectedCountries || "Pays de destination"}
            <span className="text-xs sm:text-sm text-gray-500 font-normal">
              ({(formData.selectedCountries?.length || 0)} pays)
            </span>
          </Label>

          {/* Input pour ajouter un pays */}
          <div className="flex gap-2 mt-3">
            <Input
              placeholder={t.form.placeholders.selectedCountries || "Nom du pays (ex: France, Canada...)"}
              value={newCountry}
              onChange={(e) => {
                setNewCountry(e.target.value)
                setCountryError("")
              }}
              onKeyPress={handleCountryKeyPress}
              className="flex-1 h-10 sm:h-12 text-base sm:text-lg"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCountry}
              className="h-10 sm:h-12 px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Ajouter</span>
            </Button>
          </div>

          {/* Message d'erreur */}
          {(countryError || errors.selectedCountries) && (
            <p className="text-red-500 text-xs sm:text-sm mt-1">
              {countryError || errors.selectedCountries}
            </p>
          )}

          {/* Liste des pays sélectionnés */}
          {formData.selectedCountries && formData.selectedCountries.length > 0 && (
            <div className="mt-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">
                {t.form.selectedCountriesLabel || "Pays sélectionnés :"}
              </p>
              <div className="flex flex-wrap gap-2">
                {formData.selectedCountries.map((country, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors px-3 py-1.5 text-sm"
                  >
                    🌍 {country}
                    <button
                      type="button"
                      onClick={() => removeCountry(country)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      aria-label={`Supprimer ${country}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Message d'aide */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-700">
              💡 {t.form.hints.selectedCountries || "Ajoutez les pays où vous souhaitez immigrer. Vous pouvez en ajouter autant que vous voulez."}
            </p>
          </div>

          {/* Statistiques optionnelles */}
          {formData.selectedCountries && formData.selectedCountries.length > 0 && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-green-700 font-medium">
                  ✅ {formData.selectedCountries.length} destination{formData.selectedCountries.length > 1 ? 's' : ''} configurée{formData.selectedCountries.length > 1 ? 's' : ''}
                </span>
                <span className="text-green-600">
                  {t.form.unlimitedCountries || "Nombre illimité"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}