"use client"

import { useState, useEffect } from "react"
import { signIn, getSession, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react"
import { toast } from "sonner"

export default function AdminLogin() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()
    const { data: session, status } = useSession()

    // ✅ Rediriger si déjà connecté en tant qu'admin
    useEffect(() => {
        if (status === "authenticated" && session?.user?.userType === "admin") {
            router.push("/admin")
        }
    }, [session, status, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (!email || !password) {
            setError("Veuillez remplir tous les champs")
            setLoading(false)
            return
        }

        try {
            // ✅ Utiliser le provider "admin" spécifiquement
            const result = await signIn("admin", {
                email: email.trim(),
                password,
                redirect: false,
            })

            if (result?.error) {
                setError("Identifiants invalides")
                toast.error("Échec de la connexion")
            } else {
                // ✅ Vérifier la session et rediriger
                const session = await getSession()
                if (session?.user?.userType === "admin" && (session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN")) {
                    toast.success("Connexion réussie !")
                    router.push("/admin")
                } else {
                    setError("Accès administrateur requis")
                    toast.error("Accès non autorisé")
                }
            }
        } catch (error) {
            console.error("Erreur de connexion:", error)
            setError("Erreur lors de la connexion")
            toast.error("Erreur technique")
        } finally {
            setLoading(false)
        }
    }

    // Afficher un loader si la session est en cours de vérification
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-nch-primary" />
                    <p className="text-gray-600">Vérification de la session...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header avec logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Administration
                    </h1>
                    <p className="text-gray-600">
                        Connectez-vous pour accéder au dashboard
                    </p>
                </div>

                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl text-center text-red-600">
                            Connexion Admin
                        </CardTitle>
                        <p className="text-center text-gray-500">
                            Accès réservé aux administrateurs
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Champ Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Adresse email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@nch-community.com"
                                        className="pl-10 h-11"
                                        disabled={loading}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Champ Mot de passe */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Mot de passe
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="pl-10 pr-10 h-11"
                                        disabled={loading}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        disabled={loading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Message d'erreur */}
                            {error && (
                                <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Bouton de connexion */}
                            <Button
                                type="submit"
                                className="w-full h-11 bg-red-600 hover:bg-red-700 transition-colors"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Connexion en cours...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-4 w-4 mr-2" />
                                        Se connecter
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Footer de la carte */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="text-center text-sm text-gray-500">
                                <p>Accès sécurisé par NextAuth</p>
                                <button
                                    onClick={() => router.push("/")}
                                    className="text-red-600 hover:underline mt-2 inline-block"
                                >
                                    ← Retour au site principal
                                </button>
                                <br />
                                <button
                                    onClick={() => router.push("/login")}
                                    className="text-gray-400 hover:underline mt-2 inline-block text-xs"
                                >
                                    Connexion client
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Information de démo (à supprimer en production) */}
                {process.env.NODE_ENV === "development" && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                            🔧 Mode Développement
                        </h4>
                        <p className="text-xs text-yellow-700">
                            Utilisez les identifiants de test configurés dans votre base de données.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}