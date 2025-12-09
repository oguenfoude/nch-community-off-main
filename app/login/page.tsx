"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { loginClient } from "@/lib/actions/auth.actions"

/**
 * Client Login Page
 * Clean, fast, no callback hell
 */
export default function ClientLogin() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const trimmedEmail = email.trim().toLowerCase()
        const trimmedPassword = password.trim()

        if (!trimmedEmail || !trimmedPassword) {
            setError("Veuillez remplir tous les champs")
            return
        }

        setLoading(true)
        setError("")

        try {
            const result = await loginClient(trimmedEmail, trimmedPassword)
            
            if (result.success) {
                toast.success("Connexion réussie !")
                router.push("/me")
                router.refresh()
            } else {
                setError(result.error || "Erreur de connexion")
                toast.error(result.error || "Erreur de connexion")
            }
        } catch (error) {
            console.error("Login error:", error)
            setError("Erreur lors de la connexion")
            toast.error("Erreur technique")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header avec logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-nch-primary rounded-full mb-4">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Espace Client
                    </h1>
                    <p className="text-gray-600">
                        Connectez-vous pour accéder à votre dossier
                    </p>
                </div>

                <Card className="shadow-lg border-0">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl text-center text-nch-primary">
                            Connexion Client
                        </CardTitle>
                        <p className="text-center text-gray-500">
                            Accédez à votre espace personnel
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
                                        placeholder="votre.email@exemple.com"
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
                                className="w-full h-11 bg-nch-primary hover:bg-nch-primary-dark transition-colors"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Connexion en cours...
                                    </>
                                ) : (
                                    <>
                                        <User className="h-4 w-4 mr-2" />
                                        Se connecter
                                    </>
                                )}
                            </Button>
                        </form>

                        {/* Footer de la carte */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="text-center text-sm text-gray-500">
                                <p>Vous n'avez pas encore de compte ?</p>
                                <Link
                                    href="/"
                                    className="text-nch-primary hover:underline mt-2 inline-block"
                                >
                                    S'inscrire maintenant
                                </Link>
                                <br />
                                <Link
                                    href="/admin/"
                                    className="text-gray-400 hover:underline mt-2 inline-block text-xs"
                                >
                                    Accès administrateur
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Note d'information */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                        ℹ️ Information
                    </h4>
                    <p className="text-xs text-blue-700">
                        Utilisez l'email et le mot de passe que vous avez reçus après votre inscription.
                    </p>
                </div>
            </div>
        </div>
    )
}