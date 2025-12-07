"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function ErrorContent() {
    const [errorMessage, setErrorMessage] = useState("")
    const searchParams = useSearchParams()

    useEffect(() => {
        const urlError = searchParams.get('error')
        const urlReason = searchParams.get('reason')

        let message = "Une erreur inattendue s'est produite"

        if (urlError) {
            message = decodeURIComponent(urlError)
        } else if (urlReason) {
            // Map common error reasons to user-friendly messages
            const reasonMessages: Record<string, string> = {
                'payment_pending': 'Votre paiement est en cours de traitement',
                'payment_failed': 'Le paiement a échoué',
                'callback_error': 'Erreur lors de la confirmation du paiement',
                'registration_failed': 'Erreur lors de l\'inscription',
                'session_expired': 'Votre session a expiré',
            }
            message = reasonMessages[urlReason] || decodeURIComponent(urlReason)
        } else {
            const sessionMessage = sessionStorage.getItem('errorMessage')
            if (sessionMessage) {
                message = sessionMessage
                sessionStorage.removeItem('errorMessage')
            }
        }

        setErrorMessage(message)
    }, [searchParams])

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Logo */}
                <div className="mb-6">
                    <Image 
                        src="/images/nch-logo.jpg" 
                        alt="NCH Community" 
                        width={120} 
                        height={40}
                        className="mx-auto"
                    />
                </div>

                {/* Error Icon */}
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="h-10 w-10 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Une erreur est survenue
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    {errorMessage}
                </p>

                <div className="space-y-3">
                    <Link href="/" className="block">
                        <Button className="w-full bg-[#042d8e] hover:bg-[#031d5e]">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour à l'accueil
                        </Button>
                    </Link>

                    <a href="mailto:contact@nch-community.com" className="block">
                        <Button variant="outline" className="w-full">
                            <Mail className="h-4 w-4 mr-2" />
                            Contacter le support
                        </Button>
                    </a>
                </div>

                <p className="text-xs text-gray-400 mt-6">
                    Si le problème persiste, veuillez nous contacter
                </p>
            </div>
        </div>
    )
}

export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#042d8e] mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    )
}
