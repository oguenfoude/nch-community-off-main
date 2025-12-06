import { Card, CardContent } from "@/components/ui/card"
import { Users, Clock, AlertCircle, CheckCircle } from "lucide-react"
import type { Client } from "@/lib/types"

interface StatsCardsProps {
    clients: Client[]
    total: number
}

export default function StatsCards({ clients, total }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Clients</p>
                            <p className="text-3xl font-bold text-nch-primary">{total}</p>
                        </div>
                        <Users className="h-8 w-8 text-nch-primary" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">En attente</p>
                            <p className="text-3xl font-bold text-yellow-600">
                                {clients.filter((c) => c.status === "pending").length}
                            </p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-600" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">En cours</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {clients.filter((c) => c.status === "processing").length}
                            </p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-blue-600" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Approuvés</p>
                            <p className="text-3xl font-bold text-green-600">
                                {clients.filter((c) => c.status === "approved").length}
                            </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Terminés</p>
                            <p className="text-3xl font-bold text-purple-600">
                                {clients.filter((c) => c.status === "completed").length}
                            </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-purple-600" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}