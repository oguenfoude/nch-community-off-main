// app/page.tsx
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
                  const clientData = {
                        ...formData,
                        documents: {
                              id: formData.documents.id ? {
                                    fileId: formData.documents.id.fileId,
                                    url: formData.documents.id.url,
                                    downloadUrl: formData.documents.id.downloadUrl,
                                    name: formData.documents.id.name,
                                    size: formData.documents.id.size,
                              } : null,
                              diploma: formData.documents.diploma ? {
                                    fileId: formData.documents.diploma.fileId,
                                    url: formData.documents.diploma.url,
                                    downloadUrl: formData.documents.diploma.downloadUrl,
                                    name: formData.documents.diploma.name,
                                    size: formData.documents.diploma.size,
                              } : null,
                              workCertificate: formData.documents.workCertificate ? {
                                    fileId: formData.documents.workCertificate.fileId,
                                    url: formData.documents.workCertificate.url,
                                    downloadUrl: formData.documents.workCertificate.downloadUrl,
                                    name: formData.documents.workCertificate.name,
                                    size: formData.documents.workCertificate.size,
                              } : null,
                              photo: formData.documents.photo ? {
                                    fileId: formData.documents.photo.fileId,
                                    url: formData.documents.photo.url,
                                    downloadUrl: formData.documents.photo.downloadUrl,
                                    name: formData.documents.photo.name,
                                    size: formData.documents.photo.size,
                              } : null,
                        }
                  }

                  console.log('📤 Envoi des données client:', clientData)

                  const response = await fetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clientData),
                  })

                  if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}))
                        throw new Error(errorData.error || errorData.message || 'Erreur lors de l\'inscription')
                  }

                  const result = await response.json()
                  console.log('✅ Réponse API:', result)

                  if (result.success) {
                        // ✅ Si paiement requis (CIB/Edahabia)
                        if (result.paymentRequired && result.paymentUrl) {
                              console.log('💳 Redirection vers paiement:', result.paymentUrl)

                              // ✅ Rediriger directement vers SofizPay
                              window.location.href = result.paymentUrl
                              return
                        }

                        // ✅ Inscription directe réussie (sans paiement CIB/Edahabia)


                        console.log('✅ Inscription directe réussie')

                        console.log(result);
                        sessionStorage.setItem('clientName', `${formData.firstName} ${formData.lastName}`)
                        sessionStorage.setItem('offerType', formData.selectedOffer)
                        sessionStorage.setItem("password", result.credentials.password);
                        sessionStorage.setItem("email", formData.email);
                        router.push('/success')
                  } else {
                        sessionStorage.setItem('errorMessage', result.error || "Une erreur est survenue")

                        throw new Error(result.error || "Erreur lors de l'inscription")
                  }

            } catch (error: any) {
                  console.error('❌ Erreur création client:', error)
                  sessionStorage.setItem('errorMessage', error.message || "Une erreur est survenue")
                  router.push(`/error?reason=${encodeURIComponent(error.message || "Une erreur est survenue")}`)
            } finally {
                  setTimeout(() => setIsSubmitting(false), 3000)
            }
      }

      const scrollToRegistration = () => {
            document.getElementById("registration")?.scrollIntoView({ behavior: "smooth" })
      }

      return (
            <div className={`min-h-screen bg-white ${language === "ar" ? "rtl font-cairo" : "ltr font-outfit"}`}>
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
                                    {/* ✅ VÉRIFICATION : Le composant est bien défini */}
                                    {RegistrationForm ? (
                                          <RegistrationForm
                                                language={language}
                                                onSubmit={handleFormSubmit}
                                                isSubmitting={isSubmitting}
                                          />
                                    ) : (
                                          <div className="text-center p-8 bg-red-50 rounded-lg">
                                                <p className="text-red-600">Erreur : Composant RegistrationForm non trouvé</p>
                                          </div>
                                    )}
                              </div>
                        </section>
                  </main>

                  <Footer />

                  {isSubmitting && <LoadingOverlay />}
            </div>
      )
}
