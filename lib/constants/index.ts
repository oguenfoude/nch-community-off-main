export const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "En cours", color: "bg-blue-100 text-blue-800" },
  approved: { label: "Approuvé", color: "bg-green-100 text-green-800" },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-800" },
  completed: { label: "Terminé", color: "bg-purple-100 text-purple-800" },
}

export const paymentStatusConfig = {
  unpaid: { label: "Non payé", color: "bg-red-100 text-red-800", icon: "❌" },
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800", icon: "⏳" },
  paid: { label: "Payé", color: "bg-green-100 text-green-800", icon: "✅" },
  failed: { label: "Échoué", color: "bg-red-100 text-red-800", icon: "⚠️" },
  refunded: { label: "Remboursé", color: "bg-gray-100 text-gray-800", icon: "↩️" },
  partial: { label: "Partiel", color: "bg-orange-100 text-orange-800", icon: "🔄" },
  partially_paid: { label: "Partiellement payé (50%)", color: "bg-orange-100 text-orange-800", icon: "💳" }, // ADD THIS
}

export const offerLabels = {
  basic: "Offre de Base",
  premium: "Offre Premium",
  gold: "Offre Gold",
}

export const WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna",
  "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou",
  "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine",
  "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj", "Boumerdès",
  "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma",
  "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar",
  "Ouled Djellal", "Béni Abbès", "In Salah", "In Guezzam", "Touggourt",
  "Djanet", "El M'Ghair", "El Meniaa"
]

export const DIPLOMAS = [
  "Sans diplôme", "BEF", "BEM", "Baccalauréat",
  "Licence", "Master", "Doctorat", "Formation professionnelle"
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (Google Drive supporte plus)
export const ALLOWED_FILE_TYPES = ['.pdf', '.jpg', '.jpeg', '.png']
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
]

export const STEPS = {
  BASIC_INFO: 0,
  DOCUMENTS: 1,
  OFFERS: 2,
  PAYMENT: 3
} as const

export const PAYMENT_METHODS = {
  CIB: 'cib',
  EDAHABIA: 'edahabia',
  BARIDIMOB: 'baridimob'
} as const

// Add to lib/constants/index.ts
export * from './offerPrices'