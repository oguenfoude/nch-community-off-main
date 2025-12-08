import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Globe } from "lucide-react"
import type { Client } from "@/lib/types"

interface ClientFormProps {
    client?: Client | null
    onSubmit: (client: any) => void
    onCancel: () => void
    isSubmitting?: boolean
}

export default function ClientForm({ client, onSubmit, onCancel, isSubmitting }: ClientFormProps) {
    const [formData, setFormData] = useState({
        id: client?.id || "",
        firstName: client?.firstName || "",
        lastName: client?.lastName || "",
        email: client?.email || "",
        phone: client?.phone || "",
        wilaya: client?.wilaya || "",
        diploma: client?.diploma || "",
        selectedOffer: client?.selectedOffer || "",
        paymentMethod: client?.paymentMethod || "",
        status: client?.status || "pending",
        paymentStatus: client?.paymentStatus || "unpaid",
        selectedCountries: client?.selectedCountries || [], // ✅ Nouveau champ
    })

    // ✅ États pour la gestion des pays
    const [newCountry, setNewCountry] = useState("")
    const [countryError, setCountryError] = useState("")

    // ✅ Fonction pour ajouter un pays (SANS limite)
    const addCountry = () => {
        const country = newCountry.trim()

        if (!country) {
            setCountryError("Veuillez saisir un nom de pays")
            return
        }

        if (country.length < 2) {
            setCountryError("Le nom du pays doit contenir au moins 2 caractères")
            return
        }

        // Vérifier les doublons (insensible à la casse)
        const isDuplicate = formData.selectedCountries.some(
            c => c.toLowerCase() === country.toLowerCase()
        )

        if (isDuplicate) {
            setCountryError("Ce pays est déjà dans la liste")
            return
        }

        // ✅ SUPPRIMÉ : Vérification de limite selon l'offre
        // const offerLimits = { basic: 1, premium: 2, gold: 5 }
        // const maxAllowed = offerLimits[formData.selectedOffer as keyof typeof offerLimits] || 1
        // if (formData.selectedCountries.length >= maxAllowed) {
        //     setCountryError(`L'offre ${formData.selectedOffer} permet maximum ${maxAllowed} pays`)
        //     return
        // }

        // Ajouter le pays
        setFormData({
            ...formData,
            selectedCountries: [...formData.selectedCountries, country]
        })
        setNewCountry("")
        setCountryError("")
    }

    // ✅ Fonction pour supprimer un pays
    const removeCountry = (countryToRemove: string) => {
        setFormData({
            ...formData,
            selectedCountries: formData.selectedCountries.filter(country => country !== countryToRemove)
        })
        setCountryError("")
    }

    // ✅ Gestion de l'ajout par touche Entrée
    const handleCountryKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addCountry()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // ✅ SUPPRIMÉ : Validation finale obligatoire des pays
        // if (formData.selectedCountries.length === 0) {
        //     setCountryError("Au moins un pays de destination est requis")
        //     return
        // }

        onSubmit(client ? { ...client, ...formData } : formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-scroll">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>

            <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="wilaya">Wilaya</Label>
                    <Input
                        id="wilaya"
                        value={formData.wilaya}
                        onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="diploma">Diplôme</Label>
                    <Input
                        id="diploma"
                        value={formData.diploma}
                        onChange={(e) => setFormData({ ...formData, diploma: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="selectedOffer">Offre</Label>
                    <Select
                        value={formData.selectedOffer}
                        onValueChange={(value) => {
                            // ✅ SUPPRIMÉ : Vérification de limite lors du changement d'offre
                            // const newLimits = { basic: 1, premium: 2, gold: 5 }
                            // const newLimit = newLimits[value as keyof typeof newLimits] || 1
                            // let updatedCountries = formData.selectedCountries
                            // if (formData.selectedCountries.length > newLimit) {
                            //     updatedCountries = formData.selectedCountries.slice(0, newLimit)
                            //     setCountryError(`Limite réduite à ${newLimit} pays pour l'offre ${value}`)
                            // }

                            setFormData({
                                ...formData,
                                selectedOffer: value
                                // selectedCountries: updatedCountries // ✅ Garde tous les pays
                            })
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une offre" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="basic">Offre de Base</SelectItem>
                            <SelectItem value="premium">Offre Premium</SelectItem>
                            <SelectItem value="gold">Offre Gold</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                    <Select
                        value={formData.paymentMethod}
                        onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une méthode" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cib">Carte CIB</SelectItem>
                            <SelectItem value="baridimob">CCP / BaridiMob</SelectItem>
                            <SelectItem value="later">Payer plus tard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ✅ Section pour les pays de destination (SANS limites) */}
            <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                <div>
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Pays de destination
                        <span className="text-xs text-gray-500">
                            ({formData.selectedCountries.length} pays)
                        </span>
                    </Label>

                    {/* Input pour ajouter un pays */}
                    <div className="flex gap-2 mt-2">
                        <Input
                            placeholder="Nom du pays (ex: France, Canada...)"
                            value={newCountry}
                            onChange={(e) => {
                                setNewCountry(e.target.value)
                                setCountryError("")
                            }}
                            onKeyPress={handleCountryKeyPress}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCountry}
                        // ✅ SUPPRIMÉ : disabled={formData.selectedCountries.length >= getOfferLimits()}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Message d'erreur */}
                    {countryError && (
                        <p className="text-sm text-red-600 mt-1">{countryError}</p>
                    )}

                    {/* Liste des pays sélectionnés */}
                    {formData.selectedCountries.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs text-gray-600 mb-2">Pays sélectionnés :</p>
                            <div className="flex flex-wrap gap-2">
                                {formData.selectedCountries.map((country, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                        🌍 {country}
                                        <button
                                            type="button"
                                            onClick={() => removeCountry(country)}
                                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ✅ SUPPRIMÉ : Info sur les limites d'offre */}
                    {/* {formData.selectedOffer && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                            <span className="font-medium">Limite pour l'offre {formData.selectedOffer} :</span> {getOfferLimits()} pays maximum
                        </div>
                    )} */}

                    {/* ✅ NOUVEAU : Message informatif simple */}
                    {formData.selectedCountries.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                            <span className="font-medium">✅ Nombre illimité de pays autorisé</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as Client["status"] })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="processing">En cours</SelectItem>
                            <SelectItem value="approved">Approuvé</SelectItem>
                            <SelectItem value="rejected">Rejeté</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="paymentStatus">Statut de paiement</Label>
                    <Select
                        value={formData.paymentStatus}
                        onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as any })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unpaid">Non payé</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="paid">Payé</SelectItem>
                            <SelectItem value="failed">Échec</SelectItem>
                            <SelectItem value="refunded">Remboursé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
                <Button type="submit" className="bg-nch-primary hover:bg-nch-primary-dark">
                    {client ? "Modifier" : "Ajouter"}
                </Button>
            </div>
        </form>
    )
}