"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Loader2, LogOut, User, Users, CreditCard, Clock, CheckCircle, Search, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useClients } from "@/hooks/useClients"
import { logoutAdmin } from "@/lib/actions/auth.actions"
import type { Client } from "@/lib/types"

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { clients, loading, error, pagination, fetchClients, deleteClient } = useClients()

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState("")

  const loadClients = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchClients({
        page: currentPage,
        limit: 15,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(paymentFilter !== "all" && { paymentStatus: paymentFilter }),
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [currentPage, searchTerm, statusFilter, paymentFilter, fetchClients])

  useEffect(() => {
    if (status === "authenticated") {
      loadClients()
    }
  }, [status, loadClients])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login")
    } else if (status === "authenticated" && session?.user) {
      const userType = (session.user as any).userType
      if (userType !== "admin") {
        router.push("/admin/login")
      }
    }
  }, [status, session, router])

  // Show loading while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (status === "unauthenticated" || (session?.user as any)?.userType !== "admin") {
    return null
  }

  async function handleLogout() {
    if (!confirm("Voulez-vous vous déconnecter ?")) return
    await logoutAdmin()
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce client ?")) return
    setDeletingId(id)
    try {
      await deleteClient(id)
      toast.success("Client supprimé")
      loadClients()
    } catch {
      toast.error("Erreur")
    } finally {
      setDeletingId("")
    }
  }

  function viewClient(id: string) {
    router.push(`/admin/clients/${id}`)
  }

  const stats = {
    total: pagination.total || 0,
    pending: clients.filter(c => c.status === "pending").length,
    paid: clients.filter(c => c.paymentStatus === "paid").length,
    completed: clients.filter(c => c.status === "completed").length,
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
    in_progress: { label: "En cours", color: "bg-blue-100 text-blue-700" },
    completed: { label: "Complété", color: "bg-green-100 text-green-700" },
    cancelled: { label: "Annulé", color: "bg-red-100 text-red-700" },
  }

  const paymentLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
    partial: { label: "Partiel", color: "bg-orange-100 text-orange-700" },
    paid: { label: "Payé", color: "bg-green-100 text-green-700" },
    refunded: { label: "Remboursé", color: "bg-gray-100 text-gray-700" },
  }

  const offerLabels: Record<string, string> = { basic: "Basic", premium: "Premium", gold: "Gold" }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#042d8e]" />
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/images/nch-logo.jpg" alt="NCH" width={36} height={36} className="rounded-lg" />
            <h1 className="text-lg font-bold text-[#042d8e]">Admin NCH</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadClients} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{session.user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-3 py-2 text-sm">
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-gray-500">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paid}</p>
                <p className="text-xs text-gray-500">Payés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-gray-500">Complétés</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <Card>
          <CardContent className="p-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="partial">Partiel</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#042d8e]" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Aucun client trouvé"
                  : "Aucun client enregistré"}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead className="hidden md:table-cell">Contact</TableHead>
                        <TableHead>Offre</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden sm:table-cell">Paiement</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{client.firstName} {client.lastName}</p>
                              <p className="text-xs text-gray-500">{client.wilaya}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="text-sm">
                              <p>{client.email}</p>
                              <p className="text-gray-500">{client.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {offerLabels[client.selectedOffer] || client.selectedOffer}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusLabels[client.status || 'pending']?.color || "bg-gray-100"}>
                              {statusLabels[client.status || 'pending']?.label || client.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={paymentLabels[client.paymentStatus || 'pending']?.color || "bg-gray-100"}>
                              {paymentLabels[client.paymentStatus || 'pending']?.label || client.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => viewClient(client.id)}
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => handleDelete(client.id)}
                                disabled={deletingId === client.id}
                                title="Supprimer"
                              >
                                {deletingId === client.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      {((currentPage - 1) * 15) + 1}-{Math.min(currentPage * 15, pagination.total)} sur {pagination.total}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage >= pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
