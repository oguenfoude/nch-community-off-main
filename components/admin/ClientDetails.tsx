"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, FileText, Eye, Download, Upload, Trash2, Loader2, Mail, Phone, MapPin, Globe, CreditCard, Calendar, CheckCircle, Clock, XCircle } from "lucide-react"
import type { Client } from "@/lib/types"
import { toast } from "sonner"
import StageManagement from "@/components/admin/StageManagement"

interface Props {
  selectedClient: Client | null
  isUploading: boolean
  onStatusChange: (id: string, status: Client["status"]) => void
  onPaymentStatusChange?: (id: string, status: Client["paymentStatus"]) => void
  onDocumentUpload: (id: string, type: string, file: File) => void
  onDocumentDelete: (id: string, type: string) => void
  loadingStates?: any
}

const DOCUMENTS = [
  { key: "passport", label: "Passeport", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "cv", label: "CV", required: true, accept: ".pdf" },
  { key: "diploma", label: "Diplôme", required: true, accept: ".pdf,.jpg,.jpeg,.png" },
  { key: "photo", label: "Photo d'identité", required: true, accept: ".jpg,.jpeg,.png" },
  { key: "birthCertificate", label: "Acte de naissance", required: false, accept: ".pdf,.jpg,.jpeg,.png" },
]

export default function ClientDetails({ selectedClient, isUploading, onStatusChange, onPaymentStatusChange, onDocumentUpload, onDocumentDelete, loadingStates = {} }: Props) {
  const [previewDoc, setPreviewDoc] = useState<{ url: string; label: string } | null>(null)
  const [uploading, setUploading] = useState<string[]>([])
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  if (!selectedClient) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <User className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="font-medium text-gray-600">Sélectionnez un client</h3>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur un client pour voir ses détails</p>
        </CardContent>
      </Card>
    )
  }

  function getDocUrl(key: string): string | null {
    const doc = selectedClient?.documents?.[key as keyof typeof selectedClient.documents]
    if (!doc) return null
    if (typeof doc === "string") return doc
    return (doc as any)?.url || (doc as any)?.downloadUrl || null
  }

  function getPreviewUrl(url: string): string {
    const isPdf = url.includes('/raw/upload/') || url.toLowerCase().includes('.pdf')
    return isPdf ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : url
  }

  function isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('/image/upload/')
  }

  async function handleUpload(key: string, file: File) {
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("Fichier trop volumineux (max 5MB)")
      return
    }

    setUploading(prev => [...prev, key])
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('clientId', selectedClient!.id)
      formData.append('documentType', key)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error("Erreur upload")

      const result = await res.json()

      const clientRes = await fetch(`/api/clients/${selectedClient!.id}`)
      const { client } = await clientRes.json()

      const updatedDocs = {
        ...client.documents,
        [key]: { url: result.url, downloadUrl: result.downloadUrl, name: result.fileInfo?.name }
      }

      await fetch(`/api/clients/${selectedClient!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...client, documents: updatedDocs })
      })

      toast.success("Document uploadé")
      setTimeout(() => window.location.reload(), 500)
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(prev => prev.filter(k => k !== key))
    }
  }

  const offerLabels: Record<string, string> = { basic: "Basic", premium: "Premium", gold: "Gold" }
  const offerColors: Record<string, string> = { basic: "bg-blue-100 text-blue-700", premium: "bg-purple-100 text-purple-700", gold: "bg-yellow-100 text-yellow-700" }

  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    in_progress: <Loader2 className="h-4 w-4 text-blue-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    cancelled: <XCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#042d8e]" />
              Détails client
            </span>
            <Badge className={offerColors[selectedClient.selectedOffer] || "bg-gray-100"}>
              {offerLabels[selectedClient.selectedOffer] || selectedClient.selectedOffer}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="docs">Documents</TabsTrigger>
              <TabsTrigger value="stages">Étapes</TabsTrigger>
            </TabsList>

            {/* INFO TAB */}
            <TabsContent value="info" className="space-y-4">
              {/* Name */}
              <div className="text-center pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedClient.firstName} {selectedClient.lastName}
                </h3>
                <p className="text-sm text-gray-500">Client ID: {selectedClient.id.slice(-8)}</p>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{selectedClient.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{selectedClient.wilaya}</span>
                </div>
                {selectedClient.diploma && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{selectedClient.diploma}</span>
                  </div>
                )}
              </div>

              {/* Countries */}
              {selectedClient.selectedCountries?.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Pays de destination</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedClient.selectedCountries.map((country, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {country}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div className="pt-3 border-t space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Statut dossier</label>
                  <Select
                    value={selectedClient.status}
                    onValueChange={(val) => onStatusChange(selectedClient.id, val as Client["status"])}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Complété</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {onPaymentStatusChange && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Statut paiement</label>
                    <Select
                      value={selectedClient.paymentStatus}
                      onValueChange={(val) => onPaymentStatusChange(selectedClient.id, val as Client["paymentStatus"])}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="partial">Partiel</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="refunded">Remboursé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  Inscrit le {new Date(selectedClient.createdAt).toLocaleDateString("fr-FR")}
                </div>
              </div>
            </TabsContent>

            {/* DOCUMENTS TAB */}
            <TabsContent value="docs" className="space-y-3">
              {DOCUMENTS.map(doc => {
                const url = getDocUrl(doc.key)
                const isLoading = uploading.includes(doc.key)

                return (
                  <div key={doc.key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <FileText className={`h-5 w-5 ${url ? "text-green-500" : "text-gray-300"}`} />
                        {url && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {doc.label}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className="text-xs text-gray-400">
                          {url ? "Uploadé" : "Non uploadé"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      {url ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setPreviewDoc({ url: getPreviewUrl(url), label: doc.label })}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => window.open(url, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500"
                            onClick={() => onDocumentDelete(selectedClient.id, doc.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <input
                            ref={el => { fileInputRefs.current[doc.key] = el }}
                            type="file"
                            className="hidden"
                            accept={doc.accept}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(doc.key, file)
                              e.target.value = ""
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-green-600 border-green-200"
                            onClick={() => fileInputRefs.current[doc.key]?.click()}
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                            Upload
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </TabsContent>

            {/* STAGES TAB */}
            <TabsContent value="stages">
              <StageManagement clientId={selectedClient.id} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.label}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="w-full h-[70vh]">
              <iframe
                src={previewDoc.url}
                className="w-full h-full border-0 rounded-lg"
                title={previewDoc.label}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
