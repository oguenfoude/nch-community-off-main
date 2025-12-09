"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { toast } from "sonner"
import { loginAdmin } from "@/lib/actions/auth.actions"

/**
 * Admin Login Page
 * Clean, fast, no callback hell
 */
export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!email.trim() || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await loginAdmin(email, password)
      
      if (result.success) {
        toast.success("Connexion réussie")
        
        // Wait for session to be set
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Hard navigation to ensure fresh session
        window.location.href = "/admin"
      } else {
        setError(result.error || "Erreur de connexion")
        toast.error(result.error || "Erreur de connexion")
        setLoading(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Erreur de connexion")
      toast.error("Erreur de connexion")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Image 
              src="/images/nch-logo.jpg" 
              alt="NCH" 
              width={72} 
              height={72} 
              className="mx-auto rounded-xl shadow-md"
            />
            <h1 className="text-2xl font-bold text-[#042d8e] mt-4">Admin NCH</h1>
            <p className="text-sm text-gray-500 mt-1">Panneau d'administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nch-community.com"
                  className="pl-10 h-11"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 bg-[#042d8e] hover:bg-[#031d5e] font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-[#042d8e]">
              ← Retour au site
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
