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

                    {/* Upload Progress */}
                    {isUploadingFiles && (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                            <div>
                                <p className="font-medium text-blue-900">
                                    Téléchargement des fichiers...
                                </p>
                                <p className="text-sm text-blue-700">{uploadProgress}</p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
                        <Button
                            variant="outline"
                            onClick={handlePrevious}
                            disabled={isFirstStep || isSubmitting || isUploadingFiles}
                            className="text-base sm:text-lg font-semibold bg-transparent w-full sm:w-auto order-2 sm:order-1"
                        >
                            {t.previous}
                        </Button>

                        {isLastStep ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isUploadingFiles}
                                className="bg-nch-primary hover:bg-nch-primary-dark text-base sm:text-lg font-semibold w-full sm:w-auto order-1 sm:order-2"
                            >
                                {isUploadingFiles ? (
                                    <>
                                        <Upload className="w-5 h-5 mr-2 animate-bounce" />
                                        Téléchargement...
                                    </>
                                ) : isSubmitting ? (
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