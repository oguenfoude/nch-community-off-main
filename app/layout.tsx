import type React from "react"
import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import { Outfit } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import MetaPixel from "@/components/MetaPixel"

import "./globals.css"
import { Providers } from "./providers"

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "NCH Community - Votre passerelle vers l'emploi international",
  description:
    "Nous vous accompagnons dans votre recherche d'emploi à l'étranger avec des services professionnels et personnalisés.",
  generator: 'v0.dev',
  icons: {
    icon: '/images/nch-logo.jpg',
    apple: '/images/nch-logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${cairo.variable} ${outfit.variable} antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <MetaPixel />
      </body>
    </html>
  )
}
