"use client"

import { useState, useCallback, useEffect } from "react"

import type { Client, PaginationInfo } from "@/lib/types"
interface UseClientsReturn {
  clients: Client[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo
  fetchClients: (params?: any) => Promise<void>
  createClient: (clientData: any) => Promise<Client>
  updateClient: (id: string, updates: any) => Promise<Client>
  deleteClient: (id: string) => Promise<void>
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  })

  const fetchClients = useCallback(
    async (params: any = {}) => {
      setLoading(true)
      setError(null)

      try {
        const queryParams = new URLSearchParams({
          page: params.page?.toString() || "1",
          limit: params.limit?.toString() || "10",
          ...(params.search && { search: params.search }),
          ...(params.status && params.status !== "all" && { status: params.status }),
          ...(params.paymentStatus && params.paymentStatus !== "all" && { paymentStatus: params.paymentStatus }), // Nouveau
          ...(params.sortBy && { sortBy: params.sortBy }),
          ...(params.sortOrder && { sortOrder: params.sortOrder }),
        })

        const response = await fetch(`/api/clients?${queryParams}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Erreur HTTP: ${response.status}`)
        }

        const data = await response.json()

        setClients(data.clients || [])
        setPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          total: data.total || 0,
          limit: data.limit || 10,
          hasNextPage: data.hasNextPage || false,
          hasPrevPage: data.hasPrevPage || false,
        })
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement des clients")
        console.error("Erreur fetchClients:", err)
        setClients([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          total: 0,
          limit: 10,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createClient = useCallback(
    async (clientData: any): Promise<Client> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(clientData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la création du client")
        }

        const newClient = await response.json()

        // Mettre à jour la liste locale
        setClients((prev) => [newClient, ...prev.slice(0, pagination.limit - 1)])

        // Mettre à jour le total
        setPagination((prev) => ({
          ...prev,
          total: prev.total + 1,
          totalPages: Math.ceil((prev.total + 1) / prev.limit),
        }))

        return newClient
      } catch (err: any) {
        setError(err.message || "Erreur lors de la création du client")
        throw err
      } finally {
        setLoading(false)
      }
    },
    [pagination.limit]
  )

  const updateClient = useCallback(
    async (id: string, updates: any): Promise<Client> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/clients/${updates.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la mise à jour du client")
        }

        const updatedClient = await response.json()

        // Mettre à jour la liste locale
        setClients((prev) =>
          prev.map((client) => (client._id === id ? updatedClient : client))
        )

        return updatedClient
      } catch (err: any) {
        setError(err.message || "Erreur lors de la mise à jour du client")
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/clients/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erreur lors de la suppression du client")
        }

        // Mettre à jour la liste locale
        setClients((prev) => prev.filter((client) => client._id !== id))

        // Mettre à jour le total
        setPagination((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          totalPages: Math.ceil(Math.max(0, prev.total - 1) / prev.limit),
        }))
      } catch (err: any) {
        setError(err.message || "Erreur lors de la suppression du client")
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
  }
}
