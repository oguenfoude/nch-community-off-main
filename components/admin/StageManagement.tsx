// components/admin/StageManagement.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Edit,
  Save,
  X,
  RefreshCw,
  Plus
} from "lucide-react"
import { toast } from "sonner"

interface Stage {
  id: string
  stageNumber: number
  stageName: string
  status: string
  requiredDocuments: string[]
  notes: string
  createdAt: string
  updatedAt: string
}

interface StageManagementProps {
  clientId: string
}

export default function StageManagement({ clientId }: StageManagementProps) {
  const [stages, setStages] = useState<Stage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newDocumentInput, setNewDocumentInput] = useState('')

  const stageDefinitions = [
    {
      number: 1,
      name: 'Inscription et création de compte',
      defaultDocs: []
    },
    {
      number: 2,
      name: 'Confirmation des informations et création du profil professionnel',
      defaultDocs: ['CV', 'Lettre de motivation']
    },
    {
      number: 3,
      name: 'Téléchargement du profil professionnel',
      defaultDocs: ['Portfolio', 'Certificats']
    },
    {
      number: 4,
      name: 'Équivalence des certificats et diplômes',
      defaultDocs: ['Diplômes', 'Relevés de notes']
    },
    {
      number: 5,
      name: 'Correspondance intelligente avec les exigences des entreprises',
      defaultDocs: []
    },
    {
      number: 6,
      name: 'Soumission aux entreprises',
      defaultDocs: []
    }
  ]

  useEffect(() => {
    fetchStages()
  }, [clientId])

  const fetchStages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/clients/${clientId}/stages`)
      const data = await response.json()

      if (data.success) {
        // If no stages exist, initialize them
        if (data.stages.length === 0) {
          await initializeStages()
        } else {
          setStages(data.stages)
        }
      } else {
        toast.error('Erreur lors du chargement des étapes')
      }
    } catch (error) {
      console.error('Error fetching stages:', error)
      toast.error('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const initializeStages = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/stages`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        setStages(data.stages)
        toast.success('Étapes initialisées')
      }
    } catch (error) {
      console.error('Error initializing stages:', error)
      toast.error('Erreur lors de l\'initialisation')
    }
  }

  const handleEditStage = (stage: Stage) => {
    setEditingStage({ ...stage })
    setNewDocumentInput('')
    setIsDialogOpen(true)
  }

  const handleSaveStage = async () => {
    if (!editingStage) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/clients/${clientId}/stages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageNumber: editingStage.stageNumber,
          status: editingStage.status,
          notes: editingStage.notes,
          requiredDocuments: editingStage.requiredDocuments
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Étape mise à jour avec succès')
        setIsDialogOpen(false)
        fetchStages() // Refresh the list
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Error updating stage:', error)
      toast.error('Erreur de connexion')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddDocument = () => {
    if (!editingStage || !newDocumentInput.trim()) return
    
    const updatedDocs = [...editingStage.requiredDocuments, newDocumentInput.trim()]
    setEditingStage({ ...editingStage, requiredDocuments: updatedDocs })
    setNewDocumentInput('')
  }

  const handleRemoveDocument = (index: number) => {
    if (!editingStage) return
    
    const updatedDocs = editingStage.requiredDocuments.filter((_, i) => i !== index)
    setEditingStage({ ...editingStage, requiredDocuments: updatedDocs })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pending_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'pending_review': return <Clock className="h-4 w-4" />
      case 'not_started': return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Complété'
      case 'in_progress': return 'En cours'
      case 'pending_review': return 'En attente'
      case 'not_started': return 'Non démarré'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-nch-primary" />
            <span className="ml-2 text-gray-600">Chargement des étapes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des étapes du dossier</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchStages}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Info:</strong> Cliquez sur "Modifier" pour changer le statut, 
              ajouter des notes ou gérer les documents requis pour chaque étape.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    N° Étape
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Nom de l'étape
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Documents requis
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stageDefinitions.map((def) => {
                  const stage = stages.find(s => s.stageNumber === def.number)
                  const status = stage?.status || 'not_started'
                  const docs = stage?.requiredDocuments || def.defaultDocs
                  const notes = stage?.notes || '-'

                  return (
                    <tr key={def.number} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {def.number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {def.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                          <span className="ml-1">{getStatusText(status)}</span>
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {docs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {docs.map((doc, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Aucun</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={notes}>
                          {notes}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStage(
                            stage || {
                              id: '',
                              stageNumber: def.number,
                              stageName: def.name,
                              status: 'not_started',
                              requiredDocuments: def.defaultDocs,
                              notes: '',
                              createdAt: '',
                              updatedAt: ''
                            }
                          )}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Stage Progress Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Résumé de progression</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['not_started', 'in_progress', 'pending_review', 'completed'].map(status => {
                const count = stages.filter(s => s.status === status).length
                return (
                  <div key={status} className="text-center">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                    </div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-gray-600">{getStatusText(status)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modifier l'étape {editingStage?.stageNumber}
            </DialogTitle>
            <DialogDescription>
              {editingStage?.stageName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut de l'étape</label>
              <Select
                value={editingStage?.status || 'not_started'}
                onValueChange={(value) =>
                  setEditingStage(prev => prev ? { ...prev, status: value } : null)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2 text-gray-500" />
                      Non démarré
                    </div>
                  </SelectItem>
                  <SelectItem value="in_progress">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 text-blue-500" />
                      En cours
                    </div>
                  </SelectItem>
                  <SelectItem value="pending_review">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                      En attente de révision
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Complété
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes administratives</label>
              <Textarea
                value={editingStage?.notes || ''}
                onChange={(e) =>
                  setEditingStage(prev => prev ? { ...prev, notes: e.target.value } : null)
                }
                placeholder="Ajouter des notes sur cette étape (visible par le client)..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Ces notes seront visibles par le client dans son tableau de bord
              </p>
            </div>

            {/* Required Documents */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Documents requis</label>
              
              {/* List of current documents */}
              {editingStage && editingStage.requiredDocuments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {editingStage.requiredDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-sm">{doc}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveDocument(index)}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new document */}
              <div className="flex gap-2">
                <Input
                  value={newDocumentInput}
                  onChange={(e) => setNewDocumentInput(e.target.value)}
                  placeholder="Nom du document..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddDocument()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddDocument}
                  disabled={!newDocumentInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Ajoutez les documents que le client doit fournir pour cette étape
              </p>
            </div>

            {/* Last Update Info */}
            {editingStage?.updatedAt && (
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Dernière mise à jour: {new Date(editingStage.updatedAt).toLocaleString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              onClick={handleSaveStage} 
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}