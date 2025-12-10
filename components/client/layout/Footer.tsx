// components/layout/Footer.tsx
import Image from 'next/image'
import { Mail, Phone, MapPin, Globe } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* About with Logo */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/nch-logo.jpg"
                alt="NCH"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <h3 className="text-lg font-bold">NCH Community</h3>
            </div>
            <p className="text-sm text-gray-400">
              Votre partenaire de confiance pour l'immigration et les services communautaires.
            </p>
          </div>

          {/* Contact with Icons */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>contact@nch-community.online</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Alger, Algérie</span>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Immigration</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Assistance communautaire</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Conseil personnalisé</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} NCH Community. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}