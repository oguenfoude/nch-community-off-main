import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
import { Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
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
    const [isUploadingFiles, setIsUploadingFiles] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<string>('')

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

    // ✅ Handler for pending file changes (deferred mode)
    const handlePendingFileChange = (field: keyof PendingFiles, file: File | null) => {
        setPendingFiles(prev => ({
            ...prev,
            [field]: file
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

    // ✅ Upload all pending files to Cloudinary (documents + payment receipt)
    const uploadPendingFiles = async (): Promise<{
        documents: Partial<FormData['documents']>,
        paymentReceipt: UploadedFile | null
    } | null> => {
        // Separate document files from payment receipt
        const docFiles = Object.entries(pendingFiles)
            .filter(([key, file]) => file !== null && key !== 'paymentReceipt')
        
        const receiptFile = pendingFiles.paymentReceipt
        
        // Check if we have required documents
        if (docFiles.length === 0 && !pendingFiles.id && !pendingFiles.diploma && !pendingFiles.photo) {
            toast.error('Veuillez sélectionner les documents requis')
            return null
        }

        setIsUploadingFiles(true)
        const uploadedDocs: Partial<FormData['documents']> = {}
        let uploadedReceipt: UploadedFile | null = null
        const cloudinaryFolder = getClientFolderId()

        try {
            // Upload document files
            for (const [field, file] of docFiles) {
                if (!file) continue
                
                setUploadProgress(`Téléchargement: ${file.name}...`)
                
                const result = await uploadFile(
                    file,
                    field as 'id' | 'diploma' | 'workCertificate' | 'photo',
                    cloudinaryFolder,
                    undefined
                )

                if (result) {
                    uploadedDocs[field as keyof FormData['documents']] = {
                        fileId: result.file.fileId,
                        url: result.file.url,
                        downloadUrl: result.file.downloadUrl,
                        name: result.file.name,
                        size: result.file.size,
                        type: result.file.type
                    } as UploadedFile
                } else {
                    throw new Error(`Échec du téléchargement de ${file.name}`)
                }
            }

            // Upload payment receipt if exists (for BaridiMob)
            if (receiptFile) {
                setUploadProgress(`Téléchargement: ${receiptFile.name}...`)
                
                const result = await uploadFile(
                    receiptFile,
                    'photo', // Use 'photo' type for receipt (just for the upload)
                    cloudinaryFolder,
                    undefined
                )

                if (result) {
                    uploadedReceipt = {
                        fileId: result.file.fileId,
                        url: result.file.url,
                        downloadUrl: result.file.downloadUrl,
                        name: result.file.name,
                        size: result.file.size,
                        type: result.file.type
                    }
                } else {
                    throw new Error(`Échec du téléchargement du reçu de paiement`)
                }
            }

            setUploadProgress('')
            return {
                documents: uploadedDocs,
                paymentReceipt: uploadedReceipt
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Erreur lors du téléchargement des fichiers')
            setUploadProgress('')
            return null
        } finally {
            setIsUploadingFiles(false)
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

        console.log('📤 Uploading files...')
        // Upload pending files first and get the uploaded docs
        const uploadResult = await uploadPendingFiles()
        if (!uploadResult) {
            console.error('❌ File upload failed')
            return
        }
        console.log('✅ Files uploaded:', uploadResult)

        // Create final form data with uploaded documents and payment receipt
        const finalFormData: FormData = {
            ...formData,
            documents: {
                ...formData.documents,
                ...uploadResult.documents
            },
            paymentReceipt: uploadResult.paymentReceipt || formData.paymentReceipt
        }

        console.log('📨 Submitting final form data:', finalFormData)
        console.log('📎 Payment receipt:', finalFormData.paymentReceipt)

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

    // ✅ Processing Screen - Clean & Simple
    if (showProcessingScreen) {
        return (
            <div className="w-full max-w-2xl mx-auto">
                <Card>
                    <CardContent className="p-6 sm:p-10">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Icon */}
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                            
                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Demande reçue !
                                </h2>
                                <p className="text-gray-600">
                                    Votre inscription a été enregistrée avec succès
                                </p>
                            </div>

                            {/* Email Info */}
                            <div className="w-full bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                                <div className="flex items-start gap-3">
                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 text-left">
                                        <p className="text-sm font-semibold text-blue-900 mb-1">
                                            Vérification en cours
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            Vous recevrez vos identifiants à <strong>{formData.email}</strong> après validation du paiement
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    <span>Délai de traitement : 24-48 heures</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    <span>Vérifiez vos emails (spam inclus)</span>
                                </div>
                            </div>

                            {/* Button */}
                            <Button
                                onClick={() => window.location.href = '/'}
                                className="bg-nch-primary hover:bg-nch-primary-dark w-full sm:w-auto"
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
            <StepIndicator currentStep={currentStep + 1} steps={stepTitles} />

            {/* Error Banner - Clean & Simple */}
            {hasErrors && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-2">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-red-800">
                        {language === 'fr' 
                            ? `${Object.keys(errors).length} champ(s) requis`
                            : `${Object.keys(errors).length} حقول مطلوبة`
                        }
                    </p>
                </div>
            )}

            <Card className="shadow-lg">
                <CardContent className="p-4 sm:p-6 space-y-6">
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
                            onPendingReceiptChange={(file) => handlePendingFileChange('paymentReceipt', file)}
                        />
                    )}

                    {/* Upload Progress - Simple */}
                    {isUploadingFiles && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-blue-900">Téléchargement en cours...</p>
                                {uploadProgress && <p className="text-xs text-blue-700 mt-1">{uploadProgress}</p>}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons - Clean & Simple */}
                    <div className="flex justify-between gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={isFirstStep || isSubmitting || isUploadingFiles}
                            className="flex-1 sm:flex-none"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            {t.previous}
                        </Button>

                        {isLastStep ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isUploadingFiles}
                                className="flex-1 sm:flex-none bg-nch-primary hover:bg-nch-primary-dark"
                            >
                                {isUploadingFiles ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Envoi...
                                    </>
                                ) : isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {t.submitting}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {t.submit}
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="flex-1 sm:flex-none bg-nch-primary hover:bg-nch-primary-dark"
                            >
                                {t.next}
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default RegistrationForm