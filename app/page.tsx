"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/client/layout/Header'
import { Hero } from '@/components/client/layout/Hero'
import { Footer } from '@/components/client/layout/Footer'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import RegistrationForm from '@/components/client/forms/registration/RegistrationForm'
import { translations } from '@/lib/translations'
import { FormData, Language } from '@/lib/types/form'

export default function NCHCommunity() {
  const router = useRouter()
  const [language, setLanguage] = useState<Language>('fr')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const t = translations[language]

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    
    try {
      // Prepare client data with documents
      const clientData = {
        ...formData,
        documents: {
          id: formData.documents.id || null,
          diploma: formData.documents.diploma || null,
          workCertificate: formData.documents.workCertificate || null,
          photo: formData.documents.photo || null,
          paymentReceipt: formData.paymentReceipt || null,
        }
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erreur lors de l\'inscription')
      }

      const result = await response.json()

      if (result.success) {
        // Card payment redirect
        if (result.paymentRequired && result.paymentUrl) {
          window.location.href = result.paymentUrl
          return
        }

        // Direct registration success (BaridiMob)
        sessionStorage.setItem('clientName', `${formData.firstName} ${formData.lastName}`)
        sessionStorage.setItem('offerType', formData.selectedOffer)
        sessionStorage.setItem('password', result.credentials?.password || '')
        sessionStorage.setItem('email', formData.email)
        router.push('/success')
      } else {
        throw new Error(result.error || 'Erreur lors de l\'inscription')
      }

    } catch (error: any) {
      sessionStorage.setItem('errorMessage', error.message || 'Une erreur est survenue')
      router.push(`/error?reason=${encodeURIComponent(error.message || 'Une erreur est survenue')}`)
    } finally {
      setTimeout(() => setIsSubmitting(false), 3000)
    }
  }

  const scrollToRegistration = () => {
    document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className={`min-h-screen bg-white ${language === 'ar' ? 'rtl font-cairo' : 'ltr font-outfit'}`}>
      <Header
        title={t.title}
        language={language}
        onLanguageChange={setLanguage}
      />

      <Hero
        title={t.title}
        slogan={t.slogan}
        description={t.description}
        ctaText={t.cta}
        onCtaClick={scrollToRegistration}
      />

      <main>
        <section id="registration" className="py-8 sm:py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-4xl font-bold text-center text-nch-primary mb-8 sm:mb-12">
              Inscription
            </h2>
            <RegistrationForm
              language={language}
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </section>
      </main>

      <Footer />

      {isSubmitting && <LoadingOverlay />}
    </div>
  )
}
