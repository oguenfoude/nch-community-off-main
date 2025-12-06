import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Loader2, AlertCircle } from "lucide-react"

interface Stage {
  stageNumber: number
  stageName: string
  status: string
  documents: string[]
  notes: string
}

interface StagesTableProps {
  stages: Stage[]
}

export function StagesTable({ stages }: StagesTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Complété
          </Badge>
        )
      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            En cours
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Non démarré
          </Badge>
        )
    }
  }

  return (
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
              Documents à télécharger
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {stages.map((stage) => (
            <tr key={stage.stageNumber} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {stage.stageNumber}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">
                {stage.stageName}
              </td>
              <td className="px-4 py-3">
                {getStatusBadge(stage.status)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {stage.documents.length > 0 ? stage.documents.join(', ') : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {stage.notes || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}