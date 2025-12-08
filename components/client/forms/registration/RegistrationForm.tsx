// components/forms/registration/RegistrationForm.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StepIndicator } from './StepIndicator'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { DocumentsStep } from './steps/DocumentStep'
import { OffersStep } from './steps/OffersStep'
import { PaymentStep } from './steps/PaymentStep'
import { useMultiStep } from '@/hooks/useMutltiStep'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useTranslation } from '@/hooks/useTranslation'
import { FormData, Language, PendingFiles, UploadedFile } from '@/lib/types/form'
import { STEPS } from '@/lib/constants'
import { Loader2, Mail, Upload } from 'lucide-react'
import { useFileUpload } from '@/hooks/useFileUpload'
import { toast } from 'sonner'

type RegistrationOptions = {
    language: Language
    onSubmit: (formData: FormData) => Promise<void>
    isSubmitting: boolean
}

const RegistrationForm = ({ language, onSubmit, isSubmitting }: RegistrationOptions) => {
    const t = useTranslation(language)
    const { currentStep, nextStep, prevStep, goToStep, isFirstStep, isLastStep } = useMultiStep(4)
    const { errors, setErrors, validateAll } = useFormValidation(language)
    const { uploadFile } = useFileUpload()
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

        documents: {
            id: null,
            diploma: null,
            workCertificate: null,
            photo: null,
        },
    })

    // ✅ Pending files for deferred upload (including payment receipt)
    const [pendingFiles, setPendingFiles] = useState<PendingFiles>({
        id: null,
        diploma: null,
        workCertificate: null,
        photo: null,
        paymentReceipt: null,
    })

    // ✅ Track auto-uploaded files (already on Cloudinary)
    const [uploadedFiles, setUploadedFiles] = useState<Partial<Record<keyof PendingFiles, UploadedFile | null>>>({
        id: null,
        diploma: null,
        workCertificate: null,
        photo: null,
        paymentReceipt: null,
    })

    // Generate a client folder name for Cloudinary
    const getClientFolderId = (): string => {
        if (formData.firstName && formData.lastName) {
            const cleanFirst = formData.firstName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            const cleanLast = formData.lastName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            return `${cleanFirst}-${cleanLast}-${clientFolderId}`
        }
        return clientFolderId
    }

    const updateFormData = (updates: Partial<FormData>) => {
        setFormData(prev => ({ ...prev, ...updates }))
        // Clear related errors when user starts typing
        const fieldsToUpdate = Object.keys(updates)
        if (fieldsToUpdate.length > 0 && Object.keys(errors).length > 0) {
            const newErrors = { ...errors }
            fieldsToUpdate.forEach(field => {
                delete newErrors[field as keyof typeof newErrors]
            })
            setErrors(newErrors)
        }
    }

    // ✅ Handler for pending file changes with auto-upload support (deferred mode)
    const handlePendingFileChange = (
        field: keyof PendingFiles, 
        file: File | null, 
        uploadedInfo: UploadedFile | null = null
    ) => {
        // Update the File object state
        setPendingFiles(prev => ({
            ...prev,
            [field]: file
        }))
        
        // Update the uploaded file info state
        setUploadedFiles(prev => ({
            ...prev,
            [field]: uploadedInfo
        }))
        
        // Clear document errors when file is selected
        if (file && errors.documents) {
            const newErrors = { ...errors }
            delete newErrors.documents
            setErrors(newErrors)
        }
        // Clear receipt error when receipt is selected
        if (field === 'paymentReceipt' && file && errors.paymentReceipt) {
            const newErrors = { ...errors }
            delete newErrors.paymentReceipt
            setErrors(newErrors)
        }
    }

    // ✅ Prepare uploaded files for submission (files already uploaded via auto-upload)
    const prepareUploadedFiles = (): {
        documents: Partial<FormData['documents']>,
        paymentReceipt: UploadedFile | null
    } | null => {
        // Check if we have required documents (already uploaded)
        if (!uploadedFiles.id || !uploadedFiles.diploma || !uploadedFiles.photo) {
            toast.error('Veuillez sélectionner les documents requis')
            return null
        }

        // Assemble documents from auto-uploaded files
        const uploadedDocs: Partial<FormData['documents']> = {}
        
        const docFields: (keyof PendingFiles)[] = ['id', 'diploma', 'workCertificate', 'photo']
        for (const field of docFields) {
            if (uploadedFiles[field]) {
                uploadedDocs[field as keyof FormData['documents']] = uploadedFiles[field] as UploadedFile
            }
        }

        // Get payment receipt if exists (for BaridiMob)
        const uploadedReceipt = uploadedFiles.paymentReceipt || null

        return {
            documents: uploadedDocs,
            paymentReceipt: uploadedReceipt
        }
    }

    // ✅ Next button - NO validation, just go to next step
    const handleNext = () => {
        if (!isLastStep) {
            nextStep()
        }
    }

    // ✅ Previous button
    const handlePrevious = () => {
        prevStep()
        setErrors({})
    }

    // ✅ Determine which step has errors
    const getStepWithErrors = (allErrors: any): number | null => {
        // Step 0: Basic Info
        if (allErrors.firstName || allErrors.lastName || allErrors.phone || 
            allErrors.email || allErrors.wilaya || allErrors.diploma || allErrors.selectedCountries) {
            return 0
        }
        // Step 1: Documents
        if (allErrors.documents) {
            return 1
        }
        // Step 2: Offers
        if (allErrors.selectedOffer) {
            return 2
        }
        // Step 3: Payment
        if (allErrors.paymentMethod || allErrors.paymentType || allErrors.paymentReceipt) {
            return 3
        }
        return null
    }

    // ✅ Submit button - validation happens HERE only
    const handleSubmit = async () => {
        console.log('🔄 Submit clicked - validating form...')
        console.log('📋 Form data:', formData)
        console.log('📁 Pending files:', pendingFiles)
        
        // Show initial loading state
        setShowProcessingScreen(false)
        
        // Validate ALL sections at once
        const { isValid, allErrors } = validateAll(formData, pendingFiles)
        
        console.log('✅ Validation result:', { isValid, allErrors })
        
        if (!isValid) {
            // Find which step has errors and navigate there
            const errorStep = getStepWithErrors(allErrors)
            const errorCount = Object.keys(allErrors).length
            
            // Create descriptive error message with field names
            const errorFields = Object.keys(allErrors)
            const fieldLabels: Record<string, { fr: string, ar: string }> = {
                firstName: { fr: 'Prénom', ar: 'الاسم' },
                lastName: { fr: 'Nom', ar: 'اللقب' },
                phone: { fr: 'Téléphone', ar: 'الهاتف' },
                email: { fr: 'Email', ar: 'البريد' },
                wilaya: { fr: 'Wilaya', ar: 'الولاية' },
                diploma: { fr: 'Diplôme', ar: 'الشهادة' },
                selectedCountries: { fr: 'Pays', ar: 'البلدان' },
                documents: { fr: 'Documents', ar: 'الوثائق' },
                selectedOffer: { fr: 'Offre', ar: 'العرض' },
                paymentMethod: { fr: 'Paiement', ar: 'الدفع' },
                paymentType: { fr: 'Type de paiement', ar: 'نوع الدفع' },
                paymentReceipt: { fr: 'Reçu', ar: 'الإيصال' },
            }
            
            const missingFields = errorFields
                .map(field => fieldLabels[field]?.[language] || field)
                .slice(0, 3) // Show max 3 fields
            
            const moreCount = errorCount > 3 ? errorCount - 3 : 0
            const fieldsList = missingFields.join(', ') + (moreCount > 0 ? ` (+${moreCount})` : '')
            
            // Navigate to the error step
            if (errorStep !== null && errorStep !== currentStep) {
                goToStep(errorStep)
            }
            
            // Show detailed toast with field names
            toast.error(
                language === 'fr'
                    ? `❌ Champs manquants : ${fieldsList}`
                    : `❌ حقول ناقصة : ${fieldsList}`,
                {
                    duration: 6000,
                    description: language === 'fr' 
                        ? "Les champs en rouge sont obligatoires"
                        : "الحقول باللون الأحمر مطلوبة",
                    style: {
                        background: '#FEE2E2',
                        border: '1px solid #EF4444',
                        color: '#991B1B'
                    }
                }
            )
            
            console.error('❌ Validation errors:', allErrors)
            return
        }

        console.log('📤 Preparing uploaded files...')
        // Get already auto-uploaded files
        const uploadResult = prepareUploadedFiles()
        if (!uploadResult) {
            console.error('❌ File preparation failed - missing required documents')
            return
        }
        console.log('✅ Files prepared:', uploadResult)

        // Create final form data with uploaded documents and payment receipt
        const finalFormData: FormData = {
            ...formData,
            documents: {
                ...formData.documents,
                ...uploadResult.documents,
                // ✅ Include payment receipt in documents for Google Sheets
                paymentReceipt: uploadResult.paymentReceipt || formData.paymentReceipt || null
            },
            paymentReceipt: uploadResult.paymentReceipt || formData.paymentReceipt
        }

        console.log('📨 Submitting final form data:', finalFormData)
        console.log('📎 Payment receipt:', finalFormData.documents.paymentReceipt)

        // Show processing screen for BaridiMob
        if (formData.paymentMethod === 'baridimob') {
            setShowProcessingScreen(true)
        }

        // Submit with the COMPLETE form data including uploaded docs
        await onSubmit(finalFormData)
    }

    const stepTitles = [
        t.steps.step1,
        t.steps.step2,
        t.steps.step3,
        t.steps.step4,
    ]

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

    // Check if there are any errors
    const hasErrors = Object.keys(errors).length > 0

    return (
        <div className="w-full max-w-4xl mx-auto">
            <StepIndicator currentStep={currentStep} steps={stepTitles} />

            {/* Error Summary Banner */}
            {hasErrors && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <div>
                        <p className="font-semibold text-red-800">
                            {language === 'fr' 
                                ? `${Object.keys(errors).length} champ(s) à corriger`
                                : `${Object.keys(errors).length} حقول للتصحيح`
                            }
                        </p>
                        <p className="text-sm text-red-600 mt-1">
                            {language === 'fr'
                                ? 'Veuillez remplir les champs marqués en rouge'
                                : 'يرجى ملء الحقول المميزة باللون الأحمر'
                            }
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="pb-4 sm:pb-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-nch-primary text-center sm:text-left">
                        {stepTitles[currentStep]}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6">
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
                            mode="deferred"
                            errors={errors}
                            translations={t}
                            pendingFiles={pendingFiles}
                            uploadedFiles={uploadedFiles}
                            onPendingFileChange={handlePendingFileChange}
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
                            pendingReceiptFile={pendingFiles.paymentReceipt}
                            uploadedReceiptFile={uploadedFiles.paymentReceipt || null}
                            onPendingReceiptChange={(file, uploadedInfo) => handlePendingFileChange('paymentReceipt', file, uploadedInfo)}
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

                        {isLastStep ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-nch-primary hover:bg-nch-primary-dark text-base sm:text-lg font-semibold w-full sm:w-auto order-1 sm:order-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        {t.submitting}
                                    </>
                                ) : (
                                    t.submit
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="bg-nch-primary hover:bg-nch-primary-dark text-base sm:text-lg font-semibold w-full sm:w-auto order-1 sm:order-2"
                            >
                                {t.next}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegistrationForm