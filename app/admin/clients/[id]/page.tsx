"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Globe, CreditCard, FileText, Download, Eye, Save, X, Check, AlertCircle, ListChecks } from "lucide-react"
import { toast } from "sonner"
import StageManagement from "@/components/admin/StageManagement"
import type { Client, DocumentInfo } from "@/lib/types"

interface Payment {
  id: string
  paymentType: string
  paymentMethod: string
  amount: number
  status: 'pending' | 'paid' | 'verified' | 'rejected' | 'completed' | 'failed'
  receiptUrl?: string
  createdAt: string
}

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
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("")
  const [hasChanges, setHasChanges] = useState(false)
  const [hasPaymentChanges, setHasPaymentChanges] = useState(false)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
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
      setSelectedPaymentStatus(client.paymentStatus || 'unpaid')
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

  function handlePaymentStatusChange(value: string) {
    setSelectedPaymentStatus(value)
    setHasPaymentChanges(value !== client?.paymentStatus)
  }

  async function handleSave() {
    if (!client) return
    setSaving(true)
    try {
      // Save status change
      if (hasChanges) {
        const res = await fetch(`/api/clients/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: selectedStatus }),
        })
        if (!res.ok) throw new Error("Erreur de sauvegarde du statut")
      }

      // Save payment status change
      if (hasPaymentChanges) {
        const res = await fetch(`/api/clients/${id}/payment-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: selectedPaymentStatus }),
        })
        if (!res.ok) throw new Error("Erreur de sauvegarde du paiement")
      }

      // Refresh client data
      await fetchClient()
      setHasChanges(false)
      setHasPaymentChanges(false)
      toast.success("Modifications sauvegardées")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (client) {
      setSelectedStatus(client.status)
      setSelectedPaymentStatus(client.paymentStatus || 'unpaid')
      setHasChanges(false)
      setHasPaymentChanges(false)
    }
  }

  async function handlePaymentAction(paymentId: string, action: 'accept' | 'reject', reason?: string) {
    setVerifyingPayment(true)
    try {
      const res = await fetch(`/api/clients/${id}/payment/${paymentId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason })
      })
      
      if (!res.ok) throw new Error(`Erreur ${action === 'accept' ? "d'acceptation" : "de rejet"}`)
      
      // Refresh client data
      await fetchClient()
      toast.success(action === 'accept' ? "✅ Paiement accepté !" : "❌ Paiement rejeté")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setVerifyingPayment(false)
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

          {(hasChanges || hasPaymentChanges) && (
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
                    <Badge className={
                      selectedStatus === 'completed' ? 'bg-[#042d8e] text-white' :
                      selectedStatus === 'approved' ? 'bg-green-600 text-white' :
                      selectedStatus === 'processing' ? 'bg-blue-500 text-white' :
                      selectedStatus === 'rejected' ? 'bg-red-600 text-white' :
                      'bg-yellow-500 text-white'
                    }>
                      {selectedStatus === 'completed' ? 'Complété' :
                       selectedStatus === 'approved' ? 'Approuvé' :
                       selectedStatus === 'processing' ? 'En cours' :
                       selectedStatus === 'rejected' ? 'Rejeté' :
                       'En attente'}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">En attente</Badge>
                    </SelectItem>
                    <SelectItem value="processing">
                      <Badge className="bg-blue-500 text-white hover:bg-blue-600">En cours</Badge>
                    </SelectItem>
                    <SelectItem value="approved">
                      <Badge className="bg-green-600 text-white hover:bg-green-700">Approuvé</Badge>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <Badge className="bg-red-600 text-white hover:bg-red-700">Rejeté</Badge>
                    </SelectItem>
                    <SelectItem value="completed">
                      <Badge className="bg-[#042d8e] text-white hover:bg-[#031d5a]">Complété</Badge>
                    </SelectItem>
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

        {/* Main Content with Tabs */}
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Paiement</span>
            </TabsTrigger>
            <TabsTrigger value="stages" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span className="hidden sm:inline">Étapes</span>
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-[#042d8e]" />
                  Documents du client
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
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-[#042d8e]" />
                  Informations de paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-2">Statut de paiement</p>
                <Select value={selectedPaymentStatus} onValueChange={handlePaymentStatusChange}>
                  <SelectTrigger className="w-full">
                    <Badge className={
                      selectedPaymentStatus === 'paid' ? 'bg-green-600 text-white' :
                      selectedPaymentStatus === 'pending' ? 'bg-yellow-500 text-white' :
                      selectedPaymentStatus === 'partially_paid' ? 'bg-orange-500 text-white' :
                      selectedPaymentStatus === 'failed' ? 'bg-red-600 text-white' :
                      selectedPaymentStatus === 'refunded' ? 'bg-purple-600 text-white' :
                      'bg-gray-500 text-white'
                    }>
                      {selectedPaymentStatus === 'paid' ? 'Payé' :
                       selectedPaymentStatus === 'pending' ? 'En attente' :
                       selectedPaymentStatus === 'partially_paid' ? 'Partiel' :
                       selectedPaymentStatus === 'failed' ? 'Échoué' :
                       selectedPaymentStatus === 'refunded' ? 'Remboursé' :
                       'Non payé'}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">
                      <Badge className="bg-gray-500 text-white hover:bg-gray-600">Non payé</Badge>
                    </SelectItem>
                    <SelectItem value="pending">
                      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">En attente</Badge>
                    </SelectItem>
                    <SelectItem value="partially_paid">
                      <Badge className="bg-orange-500 text-white hover:bg-orange-600">Partiel</Badge>
                    </SelectItem>
                    <SelectItem value="paid">
                      <Badge className="bg-green-600 text-white hover:bg-green-700">Payé</Badge>
                    </SelectItem>
                    <SelectItem value="failed">
                      <Badge className="bg-red-600 text-white hover:bg-red-700">Échoué</Badge>
                    </SelectItem>
                    <SelectItem value="refunded">
                      <Badge className="bg-purple-600 text-white hover:bg-purple-700">Remboursé</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  {client.payments.map(payment => {
                    const needsVerification = (payment.status === 'pending' || payment.status === 'paid') && payment.paymentMethod === 'baridimob'
                    
                    return (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium capitalize">{payment.paymentMethod}</p>
                            {needsVerification && (
                              <Badge className="bg-orange-500 text-white text-xs">
                                {payment.status === 'paid' ? 'Soumis - À vérifier' : 'En attente de vérification'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="font-medium">{formatAmount(payment.amount)}</p>
                            <Badge variant="outline" className="text-xs">
                              {payment.status === "verified" ? "Accepté" : 
                               payment.status === "paid" ? "Soumis" :
                               payment.status === "pending" ? "En attente" : 
                               payment.status === "rejected" ? "Rejeté" :
                               payment.status === "failed" ? "Échoué" : payment.status}
                            </Badge>
                          </div>
                          {needsVerification && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handlePaymentAction(payment.id, 'accept')}
                                disabled={verifyingPayment}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {verifyingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const reason = prompt("Raison du rejet (optionnel):")
                                  if (reason !== null) { // User didn't cancel
                                    handlePaymentAction(payment.id, 'reject', reason || undefined)
                                  }
                                }}
                                disabled={verifyingPayment}
                                variant="destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Stages Tab */}
          <TabsContent value="stages">
            <StageManagement clientId={id} />
          </TabsContent>
        </Tabs>

        {/* Dates Card - Outside tabs, always visible */}
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
