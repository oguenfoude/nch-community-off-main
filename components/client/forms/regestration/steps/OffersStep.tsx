// components/forms/registration/steps/OffersStep.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { FormData, FormErrors, OfferType } from '@/lib/types/form'

interface OffersStepProps {
    formData: FormData
    errors: FormErrors
    translations: any
    onChange: (data: Partial<FormData>) => void
}

export const OffersStep = ({ formData, errors, translations: t, onChange }: OffersStepProps) => {
    const selectOffer = (offerKey: OfferType) => {
        onChange({ selectedOffer: offerKey })
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {Object.entries(t.offers).map(([key, offer]: [string, any]) => (
                    <Card
                        key={key}
                        className={`cursor-pointer transition-all ${formData.selectedOffer === key ? 'ring-2 ring-nch-primary bg-blue-50' : 'hover:shadow-lg'
                            }`}
                        onClick={() => selectOffer(key as OfferType)}
                    >
                        <CardHeader className="pb-2 sm:pb-4">
                            <CardTitle className="text-base sm:text-lg text-nch-primary">{offer.title}</CardTitle>
                            <CardDescription className="text-lg sm:text-xl font-bold text-green-600">
                                {offer.price}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-1 sm:space-y-2">
                                {offer.features.map((feature: string, index: number) => (
                                    <li key={index} className="flex items-start space-x-2">
                                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            {formData.selectedOffer === key && (
                                <div className="mt-3 p-2 bg-nch-primary/10 rounded-lg">
                                    <p className="text-sm text-nch-primary font-medium text-center">
                                        ✓ Offre sélectionnée
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
            {errors.selectedOffer && <p className="text-red-500 text-sm text-center">{errors.selectedOffer}</p>}
        </div>
    )
}