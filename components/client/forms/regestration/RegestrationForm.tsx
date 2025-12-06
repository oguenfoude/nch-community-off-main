// components/forms/registration/RegistrationForm.tsx
import { generateClientFolderName } from '@/lib/utils/clientFolder'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StepIndicator } from './StepIndicator'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { DocumentsStep } from './steps/DocumentStep'
import { OffersStep } from './steps/OffersStep'
import { PaymentStep } from './steps/PaymentStep'
import { ErrorAlert } from '@/components/common/ErrorAlerts'
import { useMultiStep } from '@/hooks/useMutltiStep'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useTranslation } from '@/hooks/useTranslation'
import { FormData, Language } from '@/lib/types/form'
import { STEPS } from '@/lib/constants'
import { Loader2, Mail } from 'lucide-react'

type RegistrationOptions = {
    language: Language
    onSubmit: (formData: FormData) => Promise<void>
    isSubmitting: boolean
}

const RegistrationForm = ({ language, onSubmit, isSubmitting }: RegistrationOptions) => {
    const t = useTranslation(language)
    const { currentStep, nextStep, prevStep, isFirstStep, isLastStep } = useMultiStep(4)
    const { errors, setErrors, validateStep } = useFormValidation(language)
    const [showProcessingScreen, setShowProcessingScreen] = useState(false)

    const [clientFolderId] = useState(() => {
        const timestamp = Date.now()
        const randomId = Math.floor(Math.random() * 10000)
        return `client-${timestamp}-${randomId}`
    })

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        wilaya: '',
        diploma: '',
        selectedCountries: [],
        selectedOffer: '',
        paymentMethod: '',
        paymentType: undefined,
        paymentReceipt: null,

        driveFolder: {
            name: clientFolderId,
            id: undefined,
        },

        documents: {
            id: null,
            diploma: null,
            workCertificate: null,
            photo: null,
        },
    })

    const updateFormData = (updates: Partial<FormData>) => {
        setFormData(prev => {
            const newData = { ...prev, ...updates }

            if (newData.firstName && newData.lastName && newData.driveFolder.name === clientFolderId) {
                const prettyFolderName = generateClientFolderName(newData.firstName, newData.lastName)
                newData.driveFolder.name = prettyFolderName
            }

            return newData
        })
    }

    const getCurrentFolderName = (): string => {
        return formData.driveFolder.name || clientFolderId
    }

    const getCurrentFolderId = (): string | undefined => {
        return formData.driveFolder.id
    }

    const saveFolderId = (folderId: string) => {
        setFormData(prev => ({
            ...prev,
            driveFolder: {
                ...prev.driveFolder,
                id: folderId
            }
        }))
    }

    const handleNext = async () => {
    // ✅ ADD THIS VALIDATION CHECK
    if (!validateStep(currentStep, formData)) {
        return; // Stop here if validation fails
    }
    
    if (isLastStep) {
        if (formData.paymentMethod === 'baridimob') {
            setShowProcessingScreen(true)
            await onSubmit(formData)
        } else {
            await onSubmit(formData)
        }
    } else {
        nextStep()
        setErrors({})
    }
}

    const handlePrevious = () => {
        prevStep()
        setErrors({})
    }

    const stepTitles = [
        t.steps.step1,
        t.steps.step2,
        t.steps.step3,
        t.steps.step4,
    ]

    const hasErrors = Object.keys(errors).length > 0

    // ✅ Processing Screen for BaridiMob
    if (showProcessingScreen) {
        return (
            <div className="w-full max-w-4xl mx-auto">
                <Card className="border-2 border-orange-200">
                    <CardContent className="p-8 sm:p-12">
                        <div className="flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="relative">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Traitement en cours
                                </h2>
                                <p className="text-lg text-gray-600 max-w-md">
                                    Votre demande d'inscription a été reçue avec succès
                                </p>
                            </div>

                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 max-w-lg">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                                    <div className="text-left">
                                        <h3 className="font-semibold text-blue-900 mb-2">
                                            Vérification en cours
                                        </h3>
                                        <p className="text-sm text-blue-800">
                                            Les informations de connexion seront envoyées à l'e-mail enregistré 
                                            <strong className="block mt-1">{formData.email}</strong>
                                            après vérification du reçu de paiement
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-gray-500 space-y-1">
                                <p>⏱️ Délai de vérification : 24-48 heures</p>
                                <p>📧 Vérifiez votre boîte de réception et vos spams</p>
                            </div>

                            <Button
                                onClick={() => window.location.href = '/'}
                                className="mt-6 bg-orange-600 hover:bg-orange-700"
                            >
                                Retour à l'accueil
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <StepIndicator currentStep={currentStep} steps={stepTitles} />

            <Card>
                <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-nch-primary text-center sm:text-left">
                        {stepTitles[currentStep]}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6">
                    {hasErrors && (
                        <ErrorAlert message="Veuillez corriger les erreurs ci-dessous avant de continuer." />
                    )}

                    {currentStep === STEPS.BASIC_INFO && (
                        <BasicInfoStep
                            formData={formData}
                            errors={errors}
                            translations={t}
                            onChange={updateFormData}
                        />
                    )}

                    {currentStep === STEPS.DOCUMENTS && (
                        <DocumentsStep
                            formData={formData}
                            errors={errors}
                            translations={t}
                            onChange={updateFormData}
                            clientFolder={getCurrentFolderName()}
                            clientFolderId={getCurrentFolderId()}
                            onFolderCreated={saveFolderId}
                        />
                    )}

                    {currentStep === STEPS.OFFERS && (
                        <OffersStep
                            formData={formData}
                            errors={errors}
                            translations={t}
                            onChange={updateFormData}
                        />
                    )}

                    {currentStep === STEPS.PAYMENT && (
                        <PaymentStep
                            formData={formData}
                            errors={errors}
                            translations={t}
                            onChange={updateFormData}
                        />
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={isFirstStep || isSubmitting}
                            className="text-base sm:text-lg font-semibold bg-transparent w-full sm:w-auto order-2 sm:order-1"
                        >
                            {t.previous}
                        </Button>

                        <Button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="bg-nch-primary hover:bg-nch-primary-dark text-base sm:text-lg font-semibold w-full sm:w-auto order-1 sm:order-2"
                        >
                            {isSubmitting
                                ? t.submitting
                                : isLastStep
                                    ? t.submit
                                    : t.next
                            }
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegistrationForm