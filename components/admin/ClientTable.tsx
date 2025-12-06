import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Plus, Edit, Trash2, Eye, Filter, Loader2, ChevronLeft, ChevronRight, DollarSign } from "lucide-react"
import type { Client, PaginationInfo } from "@/lib/types"
import { statusConfig, offerLabels, paymentStatusConfig } from "@/lib/constants"

interface ClientTableProps {
    clients: Client[]
    loading: boolean
    pagination: PaginationInfo
    searchTerm: string
    statusFilter: string
    paymentStatusFilter: string
    currentPage: number
    onSearchChange: (search: string) => void
    onStatusFilterChange: (status: string) => void
    onPaymentStatusFilterChange: (status: string) => void
    onPageChange: (page: number) => void
    onSelect: (client: Client) => void
    onEdit: (client: Client) => void
    onDelete: (clientId: string) => void
    onAddClick: () => void
    onPaymentStatusChange?: (clientId: string, newPaymentStatus: Client["paymentStatus"]) => void
}

export default function ClientTable({
    clients,
    loading,
    pagination,
    searchTerm,
    statusFilter,
    paymentStatusFilter,
    currentPage,
    onSearchChange,
    onStatusFilterChange,
    onPaymentStatusFilterChange,
    onPageChange,
    onSelect,
    onEdit,
    onDelete,
    onAddClick,
    onPaymentStatusChange,
}: ClientTableProps) {
    // Générer les numéros de page à afficher
    const generatePageNumbers = () => {
        const pages = []
        const totalPages = pagination.totalPages
        const current = pagination.currentPage

        if (totalPages <= 7) {
            // Si moins de 7 pages, afficher toutes
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Toujours afficher la première page
            pages.push(1)

            if (current > 4) {
                pages.push('ellipsis1')
            }

            // Pages autour de la page courante
            const start = Math.max(2, current - 1)
            const end = Math.min(totalPages - 1, current + 1)

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i)
                }
            }

            if (current < totalPages - 3) {
                pages.push('ellipsis2')
            }

            // Toujours afficher la dernière page
            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }

        return pages
    }

    const handlePaymentStatusClick = (clientId: string, currentStatus: Client["paymentStatus"]) => {
        if (!onPaymentStatusChange) return

        // Cycle des statuts de paiement
        const statusCycle: Client["paymentStatus"][] = ["unpaid", "pending", "paid", "failed", "refunded"]
        const currentIndex = statusCycle.indexOf(currentStatus)
        const nextIndex = (currentIndex + 1) % statusCycle.length
        const nextStatus = statusCycle[nextIndex]

        onPaymentStatusChange(clientId, nextStatus)
    }

    return (
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Liste des Clients</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                {pagination.total} client{pagination.total > 1 ? 's' : ''} au total
                            </p>
                        </div>
                        <Button className="bg-nch-primary hover:bg-nch-primary-dark" onClick={onAddClick}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter Client
                        </Button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Rechercher un client..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filtre par statut */}
                        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                            <SelectTrigger className="w-48">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filtrer par statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="processing">En cours</SelectItem>
                                <SelectItem value="approved">Approuvé</SelectItem>
                                <SelectItem value="rejected">Rejeté</SelectItem>
                                <SelectItem value="completed">Terminé</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Filtre par statut de paiement */}
                        <Select value={paymentStatusFilter} onValueChange={onPaymentStatusFilterChange}>
                            <SelectTrigger className="w-48">
                                <DollarSign className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filtrer par paiement" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les paiements</SelectItem>
                                <SelectItem value="unpaid">Non payé</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                                <SelectItem value="paid">Payé</SelectItem>
                                <SelectItem value="failed">Échoué</SelectItem>
                                <SelectItem value="refunded">Remboursé</SelectItem>
                                <SelectItem value="partial">Partiel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Chargement des clients...</span>
                        </div>
                    ) : clients.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">
                                {searchTerm || statusFilter !== 'all' || paymentStatusFilter !== 'all'
                                    ? "Aucun client trouvé avec ces critères"
                                    : "Aucun client enregistré"}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Client</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Offre</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Paiement</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients.map((client) => (
                                            <TableRow key={client.id} className="cursor-pointer hover:bg-gray-50">
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">
                                                            {client.firstName} {client.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-500">{client.wilaya}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm">{client.email}</p>
                                                        <p className="text-sm text-gray-500">{client.phone}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {offerLabels[client.selectedOffer as keyof typeof offerLabels] || client.selectedOffer}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={statusConfig[client.status]?.color || "bg-gray-100 text-gray-800"}>
                                                        {statusConfig[client.status]?.label || client.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            className={`${paymentStatusConfig[client.paymentStatus]?.color || "bg-gray-100 text-gray-800"} ${onPaymentStatusChange ? "cursor-pointer hover:opacity-80" : ""
                                                                }`}
                                                            onClick={() => onPaymentStatusChange && handlePaymentStatusClick(client._id, client.paymentStatus)}
                                                            title={onPaymentStatusChange ? "Cliquer pour changer le statut" : ""}
                                                        >
                                                            <span className="mr-1">
                                                                {paymentStatusConfig[client.paymentStatus]?.icon || "❓"}
                                                            </span>
                                                            {paymentStatusConfig[client.paymentStatus]?.label || client.paymentStatus}
                                                        </Badge>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="text-sm">
                                                            {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(client.createdAt).toLocaleTimeString('fr-FR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button size="sm" variant="outline" onClick={() => onSelect(client)} title="Voir les détails">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={() => onEdit(client)} title="Modifier">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => onDelete(client.id)}
                                                            className="text-red-600 hover:text-red-700 hover:border-red-300"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination améliorée */}
                            {pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <div className="text-sm text-gray-500">
                                        Affichage de {((pagination.currentPage - 1) * pagination.limit) + 1} à{' '}
                                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)} sur{' '}
                                        {pagination.total} clients
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* Bouton Précédent */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onPageChange(pagination.currentPage - 1)}
                                            disabled={!pagination.hasPrevPage}
                                            className="flex items-center"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Précédent
                                        </Button>

                                        {/* Numéros de page */}
                                        <div className="flex items-center space-x-1">
                                            {generatePageNumbers().map((page, index) => {
                                                if (typeof page === 'string') {
                                                    return (
                                                        <span key={index} className="px-2">
                                                            ...
                                                        </span>
                                                    )
                                                }

                                                return (
                                                    <Button
                                                        key={page}
                                                        variant={pagination.currentPage === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => onPageChange(page)}
                                                        className={`w-10 h-10 ${pagination.currentPage === page
                                                            ? "bg-nch-primary text-white"
                                                            : ""
                                                            }`}
                                                    >
                                                        {page}
                                                    </Button>
                                                )
                                            })}
                                        </div>

                                        {/* Bouton Suivant */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onPageChange(pagination.currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="flex items-center"
                                        >
                                            Suivant
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}