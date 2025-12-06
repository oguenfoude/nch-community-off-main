"use client"

import { useEffect, useState } from "react"
import { Suspense } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, User, Mail, Key, LogIn, Copy, Check, Languages, Download } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useSearchParams } from 'next/navigation'

type Language = 'fr' | 'ar'

const translations = {
    fr: {
        title: "Inscription réussie !",
        thankYou: "Merci",
        forRegistration: "pour votre inscription.",
        fileRegistered: "Votre dossier a été enregistré avec succès.",
        selectedOffer: "Vous avez choisi l'offre",
        processMessage: "Nous traiterons votre demande dans les plus brefs délais et vous contacterons pour les prochaines étapes.",
        loginCredentials: "Vos identifiants de connexion",
        credentialsNote: "Veuillez noter ces informations pour vous connecter à votre espace client :",
        email: "Email",
        password: "Mot de passe",
        loginButton: "Se connecter",
        backToHome: "Retour à l'accueil",
        copied: "Copié !",
        copyEmail: "Copier l'email",
        copyPassword: "Copier le mot de passe",
        important: "Important",
        saveCredentials: "Sauvegardez ces identifiants dans un endroit sûr. Vous en aurez besoin pour accéder à votre espace personnel.",
        downloadCredentials: "Télécharger les identifiants",
        downloadSuccess: "Identifiants téléchargés !"
    },
    ar: {
        title: "تم التسجيل بنجاح !",
        thankYou: "شكراً",
        forRegistration: "لتسجيلك معنا.",
        fileRegistered: "تم تسجيل ملفك بنجاح.",
        selectedOffer: "لقد اخترت العرض",
        processMessage: "سنقوم بمعالجة طلبك في أقرب وقت ممكن وسنتواصل معك للخطوات التالية.",
        loginCredentials: "بيانات تسجيل الدخول الخاصة بك",
        credentialsNote: "يرجى ملاحظة هذه المعلومات لتسجيل الدخول إلى حسابك :",
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        loginButton: "تسجيل الدخول",
        backToHome: "العودة للرئيسية",
        copied: "تم النسخ !",
        copyEmail: "نسخ البريد الإلكتروني",
        copyPassword: "نسخ كلمة المرور",
        important: "مهم",
        saveCredentials: "احفظ هذه البيانات في مكان آمن. ستحتاجها للوصول إلى حسابك الشخصي.",
        downloadCredentials: "تحميل بيانات الدخول",
        downloadSuccess: "تم تحميل بيانات الدخول !"
    }
}

const offerTranslations = {
    fr: {
        basic: "Basic",
        premium: "Premium",
        gold: "Gold",
        vip: "VIP"
    },
    ar: {
        basic: "الأساسي",
        premium: "المميز",
        gold: "الذهبي",
        vip: "في آي بي"
    }
}

// ✅ Composant séparé pour gérer useSearchParams
function SuccessContent() {
    const [clientName, setClientName] = useState("")
    const [selectedOffer, setSelectedOffer] = useState("")
    const [temporaryPassword, setTemporaryPassword] = useState("")
    const [email, setEmail] = useState("")
    const [language, setLanguage] = useState<Language>('fr')
    const [copiedField, setCopiedField] = useState<string | null>(null)

    // ✅ useSearchParams est maintenant dans le bon contexte
    const searchParams = useSearchParams()
    const emailParams = searchParams.get('email')
    const passwordParams = searchParams.get('password')
    const nameParams = searchParams.get('name')
    const offerParams = searchParams.get('offer')
    const langParams = searchParams.get('lang') as Language

    useEffect(() => {
        console.log('🔗 Paramètres URL:', { emailParams, passwordParams, nameParams, offerParams, langParams })

        // ✅ Priorité aux paramètres URL
        if (emailParams && passwordParams) {
            console.log('📧 Utilisation des paramètres URL')
            setEmail(emailParams)
            setTemporaryPassword(passwordParams)
            setClientName(nameParams || '')
            setSelectedOffer(offerParams || '')
            setLanguage(langParams || 'fr')
        } else {
            // ✅ Fallback vers sessionStorage
            console.log('💾 Utilisation du sessionStorage')
            const name = sessionStorage.getItem('clientName') || ""
            const offer = sessionStorage.getItem('selectedOffer') || ""
            const tempPassword = sessionStorage.getItem("password") || ""
            const sessionEmail = sessionStorage.getItem("email") || ""
            const savedLanguage = sessionStorage.getItem("language") as Language || 'fr'

            setClientName(name)
            setSelectedOffer(offer)
            setTemporaryPassword(tempPassword)
            setEmail(sessionEmail)
            setLanguage(savedLanguage)
        }

        // ✅ Nettoyer le sessionStorage après utilisation (optionnel)
        // sessionStorage.removeItem('clientName')
        // sessionStorage.removeItem('selectedOffer')
        // sessionStorage.removeItem("password")
        // sessionStorage.removeItem("email")
    }, [emailParams, passwordParams, nameParams, offerParams, langParams])

    const t = translations[language]
    const offerT = offerTranslations[language]

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            toast.success(t.copied)
            setTimeout(() => setCopiedField(null), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
            toast.error("Erreur lors de la copie")
        }
    }

    const downloadCredentials = () => {
        try {
            const currentDate = new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'ar-DZ')
            const offerName = getOfferName(selectedOffer)

            // Créer le contenu du fichier selon la langue
            const content = language === 'fr'
                ? `=== IDENTIFIANTS DE CONNEXION NCH COMMUNITY ===

Date de création: ${currentDate}
Nom: ${clientName}
Offre sélectionnée: ${offerName}

--- INFORMATIONS DE CONNEXION ---
Email: ${email}
Mot de passe: ${temporaryPassword}

--- INSTRUCTIONS ---
1. Rendez-vous sur: ${window.location.origin}/login
2. Saisissez votre email et mot de passe
3. Accédez à votre espace personnel

IMPORTANT: Conservez ces informations en lieu sûr.

--- CONTACT ---
Site web: ${window.location.origin}
Support: support@nch-community.com

© NCH Community - Tous droits réservés`
                : `=== بيانات تسجيل الدخول NCH COMMUNITY ===

تاريخ الإنشاء: ${currentDate}
الاسم: ${clientName}
العرض المختار: ${offerName}

--- معلومات تسجيل الدخول ---
البريد الإلكتروني: ${email}
كلمة المرور: ${temporaryPassword}

--- التعليمات ---
1. اذهب إلى: ${window.location.origin}/login
2. أدخل بريدك الإلكتروني وكلمة المرور
3. ادخل إلى حسابك الشخصي

مهم: احتفظ بهذه المعلومات في مكان آمن.

--- الاتصال ---
الموقع الإلكتروني: ${window.location.origin}
الدعم: support@nch-community.com

© NCH Community - جميع الحقوق محفوظة`

            // Créer le blob et télécharger
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')

            link.href = url
            link.download = `nch-identifiants-${clientName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success(t.downloadSuccess)
        } catch (error) {
            console.error('Error downloading credentials:', error)
            toast.error("Erreur lors du téléchargement")
        }
    }

    const toggleLanguage = () => {
        const newLanguage = language === 'fr' ? 'ar' : 'fr'
        setLanguage(newLanguage)
        sessionStorage.setItem("language", newLanguage)
    }

    const getOfferName = (offer: string) => {
        return offerT[offer as keyof typeof offerT] || offer
    }

    return (
        <div className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
            <div className="max-w-2xl w-full space-y-6">

                {/* Language Toggle */}
                <div className="flex justify-center">
                    <Button
                        onClick={toggleLanguage}
                        variant="outline"
                        size="sm"
                        className="mb-4"
                    >
                        <Languages className="h-4 w-4 mr-2" />
                        {language === 'fr' ? 'عربي' : 'Français'}
                    </Button>
                </div>

                {/* Success Card */}
                <Card className="shadow-lg">
                    <CardHeader className="text-center pb-4">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <CardTitle className="text-2xl font-bold text-green-700">
                            {t.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Thank you message */}
                        {clientName && (
                            <p className="text-gray-700 text-center">
                                {t.thankYou} <span className="font-semibold">{clientName}</span> {t.forRegistration}
                            </p>
                        )}

                        <p className="text-gray-700 text-center">
                            {t.fileRegistered}
                            {selectedOffer && (
                                <span> {t.selectedOffer} <span className="font-semibold">{getOfferName(selectedOffer)}</span>.</span>
                            )}
                        </p>

                        <p className="text-sm text-gray-600 text-center">
                            {t.processMessage}
                        </p>
                    </CardContent>
                </Card>

                {/* Credentials Card */}
                {email && temporaryPassword && (
                    <Card className="shadow-lg border-blue-200">
                        <CardHeader className="bg-blue-50 rounded-t-lg">
                            <CardTitle className="flex items-center text-blue-800">
                                <Key className="h-5 w-5 mr-2" />
                                {t.loginCredentials}
                            </CardTitle>
                            <p className="text-sm text-blue-700 mt-2">
                                {t.credentialsNote}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600 flex items-center">
                                    <Mail className="h-4 w-4 mr-2" />
                                    {t.email}
                                </label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 p-3 bg-gray-50 border rounded-lg font-mono text-sm break-all">
                                        {email}
                                    </div>
                                    <Button
                                        onClick={() => copyToClipboard(email, 'email')}
                                        variant="outline"
                                        size="sm"
                                        className="flex-shrink-0"
                                    >
                                        {copiedField === 'email' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-600 flex items-center">
                                    <Key className="h-4 w-4 mr-2" />
                                    {t.password}
                                </label>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 p-3 bg-gray-50 border rounded-lg font-mono text-sm break-all">
                                        {temporaryPassword}
                                    </div>
                                    <Button
                                        onClick={() => copyToClipboard(temporaryPassword, 'password')}
                                        variant="outline"
                                        size="sm"
                                        className="flex-shrink-0"
                                    >
                                        {copiedField === 'password' ? (
                                            <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Download Button */}
                            <div className="pt-4">
                                <Button
                                    onClick={downloadCredentials}
                                    variant="outline"
                                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {t.downloadCredentials}
                                </Button>
                            </div>

                            {/* Important Note */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-medium text-yellow-800">
                                            {t.important}
                                        </h4>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            {t.saveCredentials}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    {email && temporaryPassword && (
                        <Link href="/login" passHref>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                <LogIn className="h-4 w-4 mr-2" />
                                {t.loginButton}
                            </Button>
                        </Link>
                    )}

                    <Link href="/" passHref>
                        <Button variant="outline" className="w-full">
                            <User className="h-4 w-4 mr-2" />
                            {t.backToHome}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

// ✅ Composant principal avec Suspense
export default function SuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    )
}