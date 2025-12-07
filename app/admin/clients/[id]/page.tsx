"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Globe, CreditCard, FileText, Download, Eye, Save, X, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Client, DocumentInfo } from "@/lib/types"

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  { value: "processing", label: "En cours", color: "bg-blue-100 text-blue-700" },
  { value: "approved", label: "Approuvé", color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejeté", color: "bg-red-100 text-red-700" },
  { value: "completed", label: "Complété", color: "bg-emerald-100 text-emerald-700" },
]

const DOCUMENT_TYPES = [
  { key: "id", label: "Passeport / Carte d'identité", required: true },
  { key: "diploma", label: "Diplôme", required: true },
  { key: "workCertificate", label: "Certificat de travail", required: false },
  { key: "photo", label: "Photo d'identité", required: true },
]

const OFFER_LABELS: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
  gold: "Gold",
}

export default function ClientDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)
  const [pdfViewerType, setPdfViewerType] = useState<"google" | "direct">("google")

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/admin/login")
    } else if (authStatus === "authenticated" && session?.user) {
      const role = session.user.role
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        router.replace("/admin/login")
      } else {
        fetchClient()
      }
    }
  }, [authStatus, session, router])

  async function fetchClient() {
    try {
      const res = await fetch(`/api/clients/${id}`)
      if (!res.ok) throw new Error("Client non trouvé")
      const client = await res.json()
      setClient(client)
      setSelectedStatus(client.status)
    } catch (err) {
      toast.error("Erreur lors du chargement")
      router.push("/admin")
    } finally {
      setLoading(false)
    }
  }

  function handleStatusChange(value: string) {
    setSelectedStatus(value)
    setHasChanges(value !== client?.status)
  }

  async function handleSave() {
    if (!client) return
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      })
      if (!res.ok) throw new Error("Erreur de sauvegarde")
      const updated = await res.json()
      setClient(updated)
      setHasChanges(false)
      toast.success("Statut mis à jour")
    } catch {
      toast.error("Erreur de sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (client) {
      setSelectedStatus(client.status)
      setHasChanges(false)
    }
  }

  function getDocumentInfo(key: string): DocumentInfo | null {
    if (!client?.documents) return null
    const doc = client.documents[key]
    if (!doc) return null
    
    // Handle string URLs
    if (typeof doc === "string" && doc.trim()) {
      return { url: doc, name: key, type: getFileType(doc) }
    }
    
    // Handle DocumentInfo objects
    if (typeof doc === "object" && doc !== null) {
      const docObj = doc as DocumentInfo
      if (docObj.url || docObj.fileId) {
        return {
          ...docObj,
          name: docObj.name || key,
          type: docObj.type || getFileType(docObj.url || "")
        }
      }
    }
    
    return null
  }

  function getFileType(url: string): string {
    if (!url) return "unknown"
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes(".pdf") || lowerUrl.includes("pdf")) return "pdf"
    if (lowerUrl.includes(".jpg") || lowerUrl.includes(".jpeg") || lowerUrl.includes(".png") || lowerUrl.includes(".gif") || lowerUrl.includes(".webp")) return "image"
    if (lowerUrl.includes("image")) return "image"
    return "unknown"
  }

  function isImageFile(url: string): boolean {
    return getFileType(url) === "image"
  }

  function isPdfFile(url: string): boolean {
    return getFileType(url) === "pdf"
  }

  function getPreviewUrl(url: string): string {
    console.log('Processing URL for preview:', url)
    
    // For Cloudinary URLs, ensure they're accessible for Google Docs viewer
    if (url.includes('cloudinary.com')) {
      // For documents (PDFs), we might need to modify the URL
      if (url.includes('/raw/upload/')) {
        // Try to make it more accessible by adding flags
        const processedUrl = url.replace('/raw/upload/', '/raw/upload/fl_attachment/')
        console.log('Processed Cloudinary raw URL:', processedUrl)
        return processedUrl
      }
      // Image URLs should work as-is
      console.log('Using Cloudinary image URL as-is:', url)
      return url
    }
    
    console.log('Using URL as-is:', url)
    return url
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatAmount(amount?: number) {
    if (!amount) return "0 DA"
    return `${amount.toLocaleString("fr-FR")} DA`
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#042d8e]" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Client non trouvé</p>
          <Button onClick={() => router.push("/admin")} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = STATUS_OPTIONS.find(s => s.value === client.status)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Image src="/images/nch-logo.jpg" alt="NCH" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold text-[#042d8e]">Détails Client</span>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#042d8e] hover:bg-[#031d5a]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Sauvegarder
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Client Info Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#042d8e]/10 rounded-full flex items-center justify-center">
                  <User className="h-7 w-7 text-[#042d8e]" />
                </div>
                <div>
                  <CardTitle className="text-xl">{client.firstName} {client.lastName}</CardTitle>
                  <p className="text-sm text-gray-500">ID: {client.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={`px-2 py-0.5 rounded text-xs ${opt.color}`}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Wilaya</p>
                  <p className="font-medium">{client.wilaya}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Diplôme</p>
                  <p className="font-medium">{client.diploma}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Pays sélectionnés</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {client.selectedCountries?.length > 0 ? (
                      client.selectedCountries.map(c => (
                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Offre</p>
                  <Badge className="bg-[#042d8e]">{OFFER_LABELS[client.selectedOffer] || client.selectedOffer}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-[#042d8e]" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {DOCUMENT_TYPES.map(doc => {
                const docInfo = getDocumentInfo(doc.key)
                const hasDoc = docInfo && docInfo.url

                return (
                  <div key={doc.key} className={`p-4 rounded-lg border ${hasDoc ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {hasDoc ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {doc.label}
                            {doc.required && <span className="text-red-500 ml-1">*</span>}
                          </p>
                          {hasDoc && docInfo?.name && (
                            <p className="text-xs text-gray-500 truncate max-w-32">{docInfo.name}</p>
                          )}
                        </div>
                      </div>

                      {hasDoc && docInfo?.url ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              console.log('Opening preview for:', doc.label, docInfo.url)
                              setPreviewDoc({ url: docInfo.url!, name: doc.label })
                            }}
                            title="Prévisualiser le document"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-100"
                            onClick={() => window.open(docInfo.url!, "_blank")}
                            title="Télécharger le document"
                          >
                            <Download className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">
                          {doc.required ? "Non uploadé" : "Optionnel"}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-[#042d8e]" />
              Paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <Badge className={
                  client.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                  client.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }>
                  {client.paymentStatus === "paid" ? "Payé" :
                   client.paymentStatus === "pending" ? "En attente" :
                   client.paymentStatus === "partially_paid" ? "Partiel" :
                   client.paymentStatus || "Non défini"}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-gray-500">Méthode</p>
                <p className="font-medium capitalize">{client.paymentMethod || "Non défini"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Montant payé</p>
                <p className="font-medium text-[#042d8e]">{formatAmount(client.paidAmount)}</p>
              </div>
            </div>

            {client.payments && client.payments.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-medium mb-3">Historique des paiements</p>
                <div className="space-y-2">
                  {client.payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium capitalize">{payment.paymentMethod}</p>
                        <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatAmount(payment.amount)}</p>
                        <Badge variant="outline" className="text-xs">
                          {payment.status === "completed" ? "Complété" : payment.status === "pending" ? "En attente" : payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-gray-500">Inscrit le</p>
                <p className="text-sm font-medium">{formatDate(client.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dernière mise à jour</p>
                <p className="text-sm font-medium">{formatDate(client.updatedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
          <div className="relative max-w-5xl w-full max-h-[95vh] bg-white rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                {isPdfFile(previewDoc.url) ? (
                  <FileText className="h-5 w-5 text-red-600" />
                ) : isImageFile(previewDoc.url) ? (
                  <Eye className="h-5 w-5 text-blue-600" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-600" />
                )}
                <div>
                  <p className="font-medium">{previewDoc.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{getFileType(previewDoc.url)} file</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPdfFile(previewDoc.url) && (
                  <div className="flex gap-1">
                    <Button 
                      variant={pdfViewerType === "google" ? "default" : "outline"}
                      size="sm" 
                      onClick={() => setPdfViewerType("google")}
                    >
                      Google Docs
                    </Button>
                    <Button 
                      variant={pdfViewerType === "direct" ? "default" : "outline"}
                      size="sm" 
                      onClick={() => setPdfViewerType("direct")}
                    >
                      Vue directe
                    </Button>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log('Opening document URL:', previewDoc.url)
                    window.open(previewDoc.url, "_blank", "noopener,noreferrer")
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Télécharger
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setPreviewDoc(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center min-h-[500px] p-4">
              {isPdfFile(previewDoc.url) ? (
                <div className="w-full h-[75vh] bg-gray-100 rounded overflow-hidden">
                  {pdfViewerType === "google" ? (
                    <iframe 
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(getPreviewUrl(previewDoc.url))}&embedded=true`}
                      className="w-full h-full border-0"
                      title={`Aper\u00e7u de ${previewDoc.name}`}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      loading="lazy"
                      onLoad={() => {
                        console.log('PDF loaded via Google Docs viewer:', getPreviewUrl(previewDoc.url))
                      }}
                      onError={() => {
                        console.error('Google Docs viewer failed for URL:', getPreviewUrl(previewDoc.url))
                        console.log('Switching to direct view')
                        setPdfViewerType("direct")
                      }}
                    />
                  ) : (
                    <iframe 
                      src={`${getPreviewUrl(previewDoc.url)}#toolbar=0&navpanes=0&scrollbar=1`}
                      className="w-full h-full border-0"
                      title={`Aper\u00e7u direct de ${previewDoc.name}`}
                      onLoad={() => console.log('PDF loaded in direct view:', getPreviewUrl(previewDoc.url))}
                      onError={() => {
                        console.error('Direct PDF view failed for URL:', getPreviewUrl(previewDoc.url))
                      }}
                    />
                  )}
                </div>
              ) : isImageFile(previewDoc.url) ? (
                <div className="w-full max-w-4xl h-[75vh] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                  <img 
                    src={getPreviewUrl(previewDoc.url)} 
                    alt={previewDoc.name} 
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                    onLoad={() => console.log('Image preview loaded successfully:', getPreviewUrl(previewDoc.url))}
                    onError={(e) => {
                      console.error('Image failed to load:', getPreviewUrl(previewDoc.url))
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'text-center py-8'
                      errorDiv.innerHTML = '<p class="text-red-600">Impossible de charger l\'image</p>'
                      target.parentNode?.appendChild(errorDiv)
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Aperçu non disponible</p>
                  <p className="text-sm text-gray-500 mb-4">Ce type de fichier ne peut pas être prévisualisé</p>
                  <Button onClick={() => window.open(previewDoc.url, "_blank")}>
                    <Download className="h-4 w-4 mr-2" />
                    Ouvrir le fichier
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
