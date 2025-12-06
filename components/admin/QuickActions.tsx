import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Download, AlertCircle, Plus } from "lucide-react"
import type { Client } from "@/lib/types"

interface QuickActionsProps {
    clients: Client[]
    onRefresh: () => void
    onAddClient: () => void
}

export default function QuickActions({ clients, onRefresh, onAddClient }: QuickActionsProps) {
    const handleExportCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8," +
            ["Prénom,Nom,Email,Téléphone,Wilaya,Diplôme,Offre,Statut,Date"].concat(
                clients.map(client =>
                    `${client.firstName},${client.lastName},${client.email},${client.phone},${client.wilaya},${client.diploma},${client.selectedOffer},${client.status},${client.createdAt}`
                )
            ).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `clients_nch_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleShowStats = () => {
        const pendingCount = clients.filter(c => c.status === "pending").length
        const approvedCount = clients.filter(c => c.status === "approved").length

        alert(`Statistiques rapides:\n- Clients en attente: ${pendingCount}\n- Clients approuvés: ${approvedCount}\n- Total: ${clients.length}`)
    }

    return (
        <div className="mt-8">
            <Card>
                <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Button
                            onClick={onRefresh}
                            className="flex items-center space-x-2"
                            variant="outline"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Actualiser la liste</span>
                        </Button>

                        <Button
                            onClick={handleExportCSV}
                            className="flex items-center space-x-2"
                            variant="outline"
                        >
                            <Download className="h-4 w-4" />
                            <span>Exporter CSV</span>
                        </Button>

                        <Button
                            onClick={handleShowStats}
                            className="flex items-center space-x-2"
                            variant="outline"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <span>Statistiques</span>
                        </Button>

                        <Button
                            onClick={onAddClient}
                            className="flex items-center space-x-2 bg-nch-primary hover:bg-nch-primary-dark"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Nouveau client</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}