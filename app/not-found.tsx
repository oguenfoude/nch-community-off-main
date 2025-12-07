// app/not-found.tsx
// ============================================
// NOT FOUND PAGE - 404 error handler
// ============================================

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4">
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

        {/* 404 Icon */}
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="h-10 w-10 text-gray-400" />
        </div>

        <h1 className="text-5xl font-bold text-[#042d8e] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Page non trouvée</h2>
        
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <Link href="/" className="block">
          <Button className="w-full bg-[#042d8e] hover:bg-[#031d5e]">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </Link>
      </div>
    </div>
  )
}
