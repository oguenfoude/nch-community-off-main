"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { RefreshCw, Loader2, Check, X, Clock, Phone, Mail, MapPin, CreditCard, ExternalLink, AlertCircle, CheckCircle2, Download, Eye, FileText } from "lucide-react"
import { toast } from "sonner"

interface PendingRegistration {
  id: string
  sessionToken: string
  status: string
  createdAt: string
  expiresAt: string
  client: {
    firstName: string
    lastName: string
    email: string
    phone: string
    wilaya: string
    selectedOffer: string
  }
  payment: {
    amount: number
    paymentMethod: string
    baridiMobInfo?: {
      rip?: string
      transactionId?: string
    }
    receiptUrl?: string
  }
}

export default function PendingRegistrations() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null; reason: string }>({ open: false, id: null, reason: "" })
  const [successDialog, setSuccessDialog] = useState<{ open: boolean; credentials: { email: string; password: string } | null }>({ open: false, credentials: null })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const res = await fetch("/api/admin/approve-registration")
      const data = await res.json()
      if (data.success) setRegistrations(data.registrations)
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleApprove(id: string) {
    setProcessingId(id)
    try {
      const res = await fetch("/api/admin/approve-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingId: id, action: "approve" })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success("Inscription approuvée")
        setSuccessDialog({ open: true, credentials: data.credentials })
        fetchData()
      } else {
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject() {
    if (!rejectDialog.id) return
    setProcessingId(rejectDialog.id)
    
    try {
      const res = await fetch("/api/admin/approve-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pendingId: rejectDialog.id, 
          action: "reject",
          rejectionReason: rejectDialog.reason || "Rejeté par l'administrateur"
        })
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success("Inscription rejetée")
        setRejectDialog({ open: false, id: null, reason: "" })
        fetchData()
      } else {
        toast.error(data.error || "Erreur")
      }
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setProcessingId(null)
    }
  }

  function getPreviewUrl(url: string) {
    const isPdf = url.includes('/raw/upload/') || url.toLowerCase().includes('.pdf')
    return isPdf ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true` : url
  }

  function isImageUrl(url: string) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('/image/upload/')
  }

  const offerStyles: Record<string, string> = {
    basic: "bg-blue-100 text-blue-700",
    premium: "bg-purple-100 text-purple-700",
    gold: "bg-yellow-100 text-yellow-700"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#042d8e]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-orange-500" />
              Inscriptions en attente
              {registrations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{registrations.length}</Badge>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">Vérifiez les paiements BaridiMob</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchData(true)} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Aucune inscription en attente</p>
              <p className="text-sm text-gray-500">Toutes les demandes ont été traitées</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div key={reg.id} className="border rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{reg.client.firstName} {reg.client.lastName}</h3>
                      <p className="text-xs text-gray-500">
                        {new Date(reg.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={offerStyles[reg.client.selectedOffer] || "bg-gray-100"}>
                        {reg.client.selectedOffer === "basic" ? "Basic" : reg.client.selectedOffer === "premium" ? "Premium" : "Gold"}
                      </Badge>
                      <Badge className="bg-green-100 text-green-700 font-semibold">
                        {(reg.payment.amount || 0).toLocaleString()} DZD
                      </Badge>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{reg.client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {reg.client.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {reg.client.wilaya}
                    </div>
                  </div>

                  {/* Receipt Section */}
                  {reg.payment.receiptUrl && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800 text-sm">Reçu BaridiMob</span>
                      </div>

                      {/* Receipt Preview */}
                      <div className="flex gap-3">
                        {isImageUrl(reg.payment.receiptUrl) ? (
                          <div 
                            className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-orange-200 cursor-pointer hover:border-orange-400 transition-colors"
                            onClick={() => setPreviewImage(reg.payment.receiptUrl!)}
                          >
                            <Image
                              src={reg.payment.receiptUrl}
                              alt="Reçu"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 flex items-center justify-center transition-colors">
                              <Eye className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-lg bg-orange-100 border-2 border-orange-200 flex flex-col items-center justify-center">
                            <FileText className="h-8 w-8 text-orange-500 mb-1" />
                            <span className="text-xs text-orange-600">PDF</span>
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(getPreviewUrl(reg.payment.receiptUrl!), "_blank")}
                            className="text-orange-700 border-orange-300 hover:bg-orange-100"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Prévisualiser
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = reg.payment.receiptUrl!
                              link.download = `recu_${reg.client.lastName}.pdf`
                              link.click()
                            }}
                            className="text-blue-700 border-blue-300 hover:bg-blue-50"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      </div>

                      {/* RIP Info */}
                      {reg.payment.baridiMobInfo?.rip && (
                        <div className="mt-3 pt-3 border-t border-orange-200 text-sm">
                          <span className="text-gray-600">RIP:</span>
                          <span className="ml-2 font-mono text-gray-800">{reg.payment.baridiMobInfo.rip}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectDialog({ open: true, id: reg.id, reason: "" })}
                      disabled={processingId === reg.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {processingId === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                      Rejeter
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(reg.id)}
                      disabled={processingId === reg.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === reg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Approuver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reçu de paiement</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative w-full h-[70vh]">
              <Image
                src={previewImage}
                alt="Reçu"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, id: null, reason: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Rejeter l'inscription
            </DialogTitle>
            <DialogDescription>Indiquez la raison du rejet (optionnel)</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
            rows={3}
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null, reason: "" })}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!processingId}>
              {processingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <X className="h-4 w-4 mr-2" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialog.open} onOpenChange={(open) => !open && setSuccessDialog({ open: false, credentials: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Inscription approuvée
            </DialogTitle>
            <DialogDescription>Identifiants de connexion du client :</DialogDescription>
          </DialogHeader>
          {successDialog.credentials && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div>
                <span className="text-sm text-gray-600">Email :</span>
                <p className="font-medium">{successDialog.credentials.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Mot de passe :</span>
                <p className="font-mono bg-white px-2 py-1 rounded border">{successDialog.credentials.password}</p>
              </div>
              <p className="text-xs text-orange-600">⚠️ Notez ces informations, le mot de passe ne peut pas être récupéré.</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSuccessDialog({ open: false, credentials: null })}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
