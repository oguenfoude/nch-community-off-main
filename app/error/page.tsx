"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"

// ✅ Composant interne qui utilise useSearchParams
function ErrorContent() {
    const [errorMessage, setErrorMessage] = useState("")
    const searchParams = useSearchParams()

    useEffect(() => {
        // ✅ Récupérer le message d'erreur depuis les paramètres d'URL
        const urlError = searchParams.get('error')
        const urlMessage = searchParams.get('reason')

        // ✅ Priorité : URL params > sessionStorage > message par défaut
        let message = "Une erreur inattendue s'est produite"

        if (urlError) {
            message = decodeURIComponent(urlError)
        } else if (urlMessage) {
            message = decodeURIComponent(urlMessage)
        } else {
            // Fallback vers sessionStorage si pas de paramètres URL
            const sessionMessage = sessionStorage.getItem('errorMessage')
            if (sessionMessage) {
                message = sessionMessage
            }
        }

        setErrorMessage(message)

        // ✅ Nettoyer le sessionStorage après récupération
        sessionStorage.removeItem('errorMessage')
    }, [searchParams])

    // ✅ Récupérer directement le paramètre reason pour l'affichage
    const urlMessage = searchParams.get('reason')

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />

                <h1 className="text-2xl font-bold text-red-700 mb-4">
                    Erreur lors de l'inscription
                </h1>

                {urlMessage && (
                    <h2 className="text-xl font-semibold text-red-600 mb-4">
                        {decodeURIComponent(urlMessage)}
                    </h2>
                )}

                <p className="text-gray-700 mb-6">
                    {errorMessage}
                </p>

                <p className="text-sm text-gray-600 mb-8">
                    Veuillez réessayer ou contacter notre équipe support si le problème persiste.
                </p>

                <div className="space-y-4">
                    <Link href="/" passHref>
                        <Button className="w-full">
                            Retour à l'inscription
                        </Button>
                    </Link>

                    <Link href="mailto:contact@nch-community.com" passHref>
                        <Button variant="outline" className="w-full">
                            Contacter le support
                        </Button>
                    </Link>
                </div>

                {/* ✅ Debug en développement */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-2 bg-yellow-50 rounded text-xs text-left">
                        <strong>Debug:</strong>
                        <pre className="mt-1">
                            URL Error: {searchParams.get('error') || 'null'}{'\n'}
                            URL Reason: {searchParams.get('reason') || 'null'}{'\n'}
                            Error Message: {errorMessage}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}

// ✅ Composant principal avec Suspense
export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    )
}