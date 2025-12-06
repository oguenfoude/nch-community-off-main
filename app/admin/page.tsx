"use client"

import React, { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { XCircle, RefreshCw, Loader2, LogOut, User, Settings } from "lucide-react"
import { toast } from "sonner"
import { useClients } from "@/hooks/useClients"
import { useRouter } from "next/navigation"

// Components
import ClientForm from "@/components/admin/ClientForm"
import StatsCards from "@/components/admin/StatsCards"
import ClientTable from "@/components/admin/ClientTable"
import ClientDetails from "@/components/admin/ClientDetails"
import QuickActions from "@/components/admin/QuickActions"

// Types
import type { Client } from "@/lib/types"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  } = useClients()

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // ✅ États de chargement pour les différentes actions
  const [loadingStates, setLoadingStates] = useState({
    adding: false,
    editing: false,
    deleting: '',
    statusUpdate: '',
    paymentStatusUpdate: '',
    refreshing: false
  })

  // ✅ Vérifier l'authentification
  useEffect(() => {
    if (status === "loading") return // Encore en cours de chargement

    if (status === "unauthenticated") {
      router.push("/admin/login")
      return
    }

    if (session?.user && (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      toast.error("Accès non autorisé")
      router.push("/admin/login")
      return
    }
  }, [status, session, router])

  // ✅ Fonction de déconnexion
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // Afficher une confirmation
      const confirmed = window.confirm("Êtes-vous sûr de vouloir vous déconnecter ?")
      if (!confirmed) {
        setIsLoggingOut(false)
        return
      }

      toast.info("Déconnexion en cours...")

      // Déconnexion avec NextAuth
      await signOut({
        callbackUrl: "/admin/login", // Redirection après déconnexion
        redirect: true
      })

    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      toast.error("Erreur lors de la déconnexion")
      setIsLoggingOut(false)
    }
  }

  // ✅ Fonction utilitaire pour gérer les états de chargement
  const setLoadingState = (key: keyof typeof loadingStates, value: string | boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }))
  }

  // Charger les clients au montage du composant
  useEffect(() => {
    if (session?.user) {
      handleFetchClients()
    }
  }, [currentPage, searchTerm, statusFilter, paymentStatusFilter, session])

  const handleFetchClients = async () => {
    setLoadingState('refreshing', true)
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(paymentStatusFilter !== "all" && { paymentStatus: paymentStatusFilter }),
      }
      await fetchClients(params)
    } finally {
      setLoadingState('refreshing', false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      setLoadingState('deleting', clientId)
      try {
        await deleteClient(clientId)
        toast.success("Client supprimé avec succès")
        handleFetchClients()
        if (selectedClient?.id === clientId) {
          setSelectedClient(null)
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression")
      } finally {
        setLoadingState('deleting', '')
      }
    }
  }

  const handleStatusChange = async (clientId: string, newStatus: Client["status"]) => {
    setLoadingState('statusUpdate', clientId)
    try {
      await updateClient(clientId, { status: newStatus })
      toast.success("Statut mis à jour avec succès")
      handleFetchClients()
      if (selectedClient?.id === clientId) {
        setSelectedClient({ ...selectedClient, status: newStatus })
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour")
    } finally {
      setLoadingState('statusUpdate', '')
    }
  }

  const handlePaymentStatusChange = async (clientId: string, newPaymentStatus: Client["paymentStatus"]) => {
    setLoadingState('paymentStatusUpdate', clientId)
    try {
      await updateClient(clientId, { paymentStatus: newPaymentStatus })
      toast.success("Statut de paiement mis à jour")
      handleFetchClients()
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du statut de paiement:", error)
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setLoadingState('paymentStatusUpdate', '')
    }
  }

  const handleAddClient = async (newClientData: any) => {
    setLoadingState('adding', true)
    try {
      await createClient(newClientData)
      toast.success("Client ajouté avec succès")
      setIsAddDialogOpen(false)
      handleFetchClients()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout")
    } finally {
      setLoadingState('adding', false)
    }
  }

  const handleEditClient = async (updatedClient: Client) => {
    setLoadingState('editing', true)
    try {
      await updateClient(updatedClient.id, updatedClient)
      toast.success("Client modifié avec succès")
      setIsEditDialogOpen(false)
      setEditingClient(null)
      handleFetchClients()
      if (selectedClient?.id === updatedClient.id) {
        setSelectedClient(updatedClient)
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification")
    } finally {
      setLoadingState('editing', false)
    }
  }

  const handleDocumentUpload = async (clientId: string, documentType: string, file: File) => {
    try {
      setIsUploading(true)

      // Upload direct vers Google Drive via votre API
      const formData = new FormData()
      formData.append("file", file)
      formData.append("documentType", documentType)

      // Upload direct vers Google Drive via l'API documents
      const response = await fetch(`/api/clients/${clientId}/documents`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'upload")
      }

      const result = await response.json()

      toast.success("Document uploadé avec succès")
      handleFetchClients()

      // Mettre à jour le client sélectionné
      if (selectedClient?.id === clientId) {
        setSelectedClient({
          ...selectedClient,
          documents: {
            ...selectedClient.documents,
            [documentType]: result.url,
          },
        })
      }

      return result

    } catch (error: any) {
      console.error('Erreur upload document:', error)
      toast.error(error.message || "Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDocumentDelete = async (clientId: string, documentType: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      try {
        const response = await fetch(`/api/clients/${clientId}/documents?type=${documentType}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression du document")
        }

        toast.success("Document supprimé avec succès")
        handleFetchClients()

        // Mettre à jour le client sélectionné
        if (selectedClient?.id === clientId) {
          const updatedDocuments = { ...selectedClient.documents }
          delete updatedDocuments[documentType as keyof typeof updatedDocuments]
          setSelectedClient({
            ...selectedClient,
            documents: updatedDocuments,
          })
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression")
      }
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // ✅ Affichage de chargement pendant l'authentification
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-nch-primary mx-auto mb-4" />
            <p className="text-gray-700">Vérification de l'authentification...</p>
          </div>
        </Card>
      </div>
    )
  }

  // ✅ Si pas de session, ne pas afficher le dashboard
  if (!session?.user) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={handleFetchClients}
              className="bg-nch-primary hover:bg-nch-primary-dark"
              disabled={loadingStates.refreshing}
            >
              {loadingStates.refreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {loadingStates.refreshing ? 'Chargement...' : 'Réessayer'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/images/nch-logo.jpg" alt="NCH Community Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-nch-primary">Dashboard Admin</h1>
                <p className="text-gray-600">Gestion des clients NCH Community</p>
              </div>
            </div>

            {/* ✅ Menu utilisateur avec déconnexion */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleFetchClients}
                variant="outline"
                size="sm"
                disabled={loadingStates.refreshing}
              >
                {loadingStates.refreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loadingStates.refreshing ? 'Actualisation...' : 'Actualiser'}
              </Button>

              <Button onClick={() => (window.location.href = "/")} variant="outline">
                Retour au site
              </Button>

              {/* ✅ Menu déroulant utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{session.user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm text-gray-700">
                    <div className="font-medium">{session.user.name}</div>
                    <div className="text-xs text-gray-500">{session.user.email}</div>
                    <div className="text-xs text-nch-primary font-medium">{session.user.role}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Le reste du dashboard reste identique */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <StatsCards clients={clients} total={pagination.total} />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client Table */}
          <ClientTable
            clients={clients}
            loading={loading}
            pagination={pagination}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            paymentStatusFilter={paymentStatusFilter}
            currentPage={currentPage}
            onSearchChange={setSearchTerm}
            onStatusFilterChange={setStatusFilter}
            onPaymentStatusFilterChange={setPaymentStatusFilter}
            onPageChange={handlePageChange}
            onSelect={setSelectedClient}
            onEdit={(client) => {
              setEditingClient(client)
              setIsEditDialogOpen(true)
            }}
            onDelete={handleDeleteClient}
            onAddClick={() => setIsAddDialogOpen(true)}
            onPaymentStatusChange={handlePaymentStatusChange}
            loadingStates={loadingStates}
          />

          {/* Client Details */}
          <ClientDetails
            selectedClient={selectedClient}
            isUploading={isUploading}
            onStatusChange={handleStatusChange}
            onPaymentStatusChange={handlePaymentStatusChange}
            onDocumentUpload={handleDocumentUpload}
            onDocumentDelete={handleDocumentDelete}
            loadingStates={loadingStates}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions
          clients={clients}
          onRefresh={handleFetchClients}
          onAddClient={() => setIsAddDialogOpen(true)}
          isRefreshing={loadingStates.refreshing}
        />

        {/* Dialogs - garder tous les dialogs existants */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau client</DialogTitle>
              <DialogDescription>Remplissez les informations du nouveau client.</DialogDescription>
            </DialogHeader>
            <ClientForm
              onSubmit={handleAddClient}
              onCancel={() => setIsAddDialogOpen(false)}
              isSubmitting={loadingStates.adding}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le client</DialogTitle>
              <DialogDescription>Modifiez les informations du client.</DialogDescription>
            </DialogHeader>
            <ClientForm
              client={editingClient}
              onSubmit={handleEditClient}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setEditingClient(null)
              }}
              isSubmitting={loadingStates.editing}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ Overlay de chargement global */}
      {(loadingStates.adding || loadingStates.editing || isLoggingOut) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-nch-primary mx-auto mb-4" />
              <p className="text-gray-700">
                {loadingStates.adding && "Ajout du client en cours..."}
                {loadingStates.editing && "Modification du client en cours..."}
                {isLoggingOut && "Déconnexion en cours..."}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
