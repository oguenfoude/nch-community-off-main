// app/api/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { GoogleDriveService } from "@/lib/googleDriveService"
import axios from "axios"
import crypto from 'crypto'
import SofizPaySDK from 'sofizpay-sdk-js';

// ✅ Fonction pour générer un mot de passe aléatoire
function generateRandomPassword(firstName: string, lastName: string): string {
    // Nettoyer les noms (enlever espaces et caractères spéciaux)
    const cleanFirstName = firstName.replace(/[^a-zA-Z]/g, '').toLowerCase()
    const cleanLastName = lastName.replace(/[^a-zA-Z]/g, '').toLowerCase()

    // Générer un nombre aléatoire entre 1000 et 9999
    const randomNumber = Math.floor(Math.random() * 9000) + 1000

    // Format: prenom-nom-XXXX
    return `${cleanFirstName}-${cleanLastName}-${randomNumber}`
}

// ✅ Fonction pour vérifier si l'email existe déjà (dans toutes les tables)
async function checkEmailExists(email: string): Promise<{ exists: boolean; source?: string }> {
    const normalizedEmail = email.trim().toLowerCase()

    try {
        // Vérifier dans la table clients
        const existingClient = await prisma.client.findUnique({
            where: { email: normalizedEmail }
        })

        if (existingClient) {
            return { exists: true, source: 'client' }
        }

        // Vérifier dans la table admins (optionnel)
        const existingAdmin = await prisma.admin.findUnique({
            where: { email: normalizedEmail }
        })

        if (existingAdmin) {
            return { exists: true, source: 'admin' }
        }

        // Vérifier dans les inscriptions en attente
        // const pendingRegistration = await prisma.pendingRegistration.findFirst({
        //     where: {
        //         registrationData: {
        //             path: ['email'],
        //             equals: normalizedEmail
        //         },
        //         status: 'pending'
        //     }
        // })

        // if (pendingRegistration) {
        //     return { exists: true, source: 'pending' }
        // }

        return { exists: false }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'email:', error)
        throw new Error('Erreur lors de la vérification de l\'email')
    }
}

async function createClient(data: any) {
    // ✅ Générer le mot de passe avant la création
    const generatedPassword = generateRandomPassword(data.firstName, data.lastName)

    console.log(`🔑 Mot de passe généré pour ${data.firstName} ${data.lastName}: ${generatedPassword}`)

    // ✅ Créer avec Prisma en incluant le mot de passe
    const client = await prisma.client.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            wilaya: data.wilaya,
            diploma: data.diploma,
            selectedOffer: data.selectedOffer,
            paymentMethod: data.paymentMethod,
            paymentType: data.paymentType, // ✅ NEW: Store payment type
            baridiMobInfo: data.baridiMobInfo || null, // ✅ Store BaridiMob info
            selectedCountries: data.selectedCountries,
            documents: data.documents,
            driveFolder: data.driveFolder,
            password: generatedPassword, // ✅ Ajouter le mot de passe généré
            status: 'pending', // ✅ Statut initial
        }
    });

    return { client, password: generatedPassword };
}

// Fonction pour le paiement CIB (même que dans process-payment)
const makeCIBTransaction = async (transactionData: {
    account: string;
    amount: number;
    full_name: string;
    phone: string;
    email: string;
    return_url: string;
    memo: string;
    redirect: string | undefined;
}) => {
    // Validation
    if (!transactionData.account) throw new Error('Account is required.')
    if (!transactionData.amount || transactionData.amount <= 0) throw new Error('Valid amount is required.')
    if (!transactionData.full_name) throw new Error('Full name is required.')
    if (!transactionData.phone) throw new Error('Phone number is required.')
    if (!transactionData.email) throw new Error('Email is required.')

    try {
        const baseUrl = 'https://www.sofizpay.com/make-cib-transaction/'
        const params = new URLSearchParams()

        params.append('account', transactionData.account)
        params.append('amount', transactionData.amount.toString())
        params.append('full_name', transactionData.full_name)
        params.append('phone', transactionData.phone)
        params.append('email', transactionData.email)

        if (transactionData.return_url) {
            params.append('return_url', transactionData.return_url)
        }

        if (transactionData.memo) {
            params.append('memo', transactionData.memo)
        }
        if (transactionData.redirect !== undefined) {
            params.append('redirect', transactionData.redirect)
        }

        const fullUrl = `${baseUrl}?${params.toString()}`

        const response = await axios.get(fullUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })

        return {
            success: true,
            data: response.data,
            url: fullUrl,
            account: transactionData.account,
            amount: transactionData.amount,
            full_name: transactionData.full_name,
            phone: transactionData.phone,
            email: transactionData.email,
            memo: transactionData.memo,
            timestamp: new Date().toISOString()
        }
    } catch (error: any) {
        console.error('Error making CIB transaction:', error)
        return {
            success: false,
            error: error.message || 'Transaction failed',
            account: transactionData.account,
            amount: transactionData.amount,
            timestamp: new Date().toISOString()
        }
    }
}

// ✅ NEW: Calculate payment amount based on offer and payment type
export const calculatePaymentAmount = (offer: string, paymentType: 'full' | 'partial'): number => {
    const basePrices = {
        basic: 21000,
        premium: 28000,
        gold: 35000
    }
    
    const basePrice = basePrices[offer as keyof typeof basePrices] || 21000
    
    if (paymentType === 'full') {
        // Full payment with 1000 DA discount
        return basePrice - 1000
    } else {
        // Partial payment: 50% upfront
        return basePrice * 0.5
    }
}

// ✅ Keep old function for backwards compatibility
export const getAmountByOffer = (offer: string): number => {
    switch (offer) {
        case 'basic': return 21000
        case 'premium': return 28000
        case 'gold': return 35000
        default: return 21000
    }
}

// ✅ Fonction pour envoyer l'email avec les identifiants (optionnel)
async function sendCredentialsEmail(email: string, firstName: string, lastName: string, password: string) {
    try {
        // Ici vous pouvez intégrer votre service d'email préféré
        // Exemple avec un service d'email simple
        console.log(`📧 Email à envoyer à ${email}:`)
        console.log(`Bonjour ${firstName} ${lastName},`)
        console.log(`Votre inscription a été confirmée.`)
        console.log(`Vos identifiants de connexion:`)
        console.log(`Email: ${email}`)
        console.log(`Mot de passe: ${password}`)
        console.log(`Connectez-vous sur: ${process.env.NEXTAUTH_URL}/login`)

        // TODO: Implémenter l'envoi d'email réel
        return true
    } catch (error) {
        console.error('❌ Erreur envoi email:', error)
        return false
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('📝 Début inscription client...')
        const sdk = new SofizPaySDK();

        const body = await request.json()
        console.log("body", body)

        // ✅ Validation stricte avec sanitisation ET vérification email
        const sanitizedData = await sanitizeAndValidate(body)
        console.log('✅ Données validées et sanitizées:', sanitizedData)

        // ✅ Si paiement CIB ou Edahabia
        if (sanitizedData.paymentMethod === 'cib' || sanitizedData.paymentMethod === 'edahabia') {
            console.log('💳 Traitement du paiement...')

            // ✅ Générer un token sécurisé
            const sessionToken = crypto.randomBytes(32).toString('hex')
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
            // ✅ NEW: Calculate amount based on payment type
            const amount = calculatePaymentAmount(
                sanitizedData.selectedOffer, 
                sanitizedData.paymentType || 'partial' // Default to partial if not specified
            )

            console.log(`💰 Montant calculé: ${amount} DA (${sanitizedData.paymentType === 'full' ? 'Paiement intégral' : 'Premier versement'})`)
            // ✅ Générer le mot de passe avant de sauvegarder
            const generatedPassword = generateRandomPassword(sanitizedData.firstName, sanitizedData.lastName)

            // ✅ Sauvegarder temporairement en base avec Prisma (incluant le mot de passe)
            const pendingRegistration = await prisma.pendingRegistration.create({
                data: {
                    sessionToken,
                    registrationData: {
                        ...sanitizedData,
                        password: generatedPassword // ✅ Inclure le mot de passe dans les données
                    },
                    paymentDetails: {
                        amount,
                        baseAmount: getAmountByOffer(sanitizedData.selectedOffer), // ✅ Store base amount
                        offer: sanitizedData.selectedOffer,
                        method: sanitizedData.paymentMethod,
                        paymentType: sanitizedData.paymentType, // ✅ Store payment type
                        isFirstPayment: sanitizedData.paymentType === 'partial', // ✅ Track if first payment
                        remainingAmount: sanitizedData.paymentType === 'partial' 
                            ? getAmountByOffer(sanitizedData.selectedOffer) * 0.5 
                            : 0 // ✅ Calculate remaining amount
                    },
                    status: 'pending',
                }
            })

             const memoText = sanitizedData.paymentType === 'full'
                ? `Paiement intégral NCH - ${sanitizedData.selectedOffer}`
                : `Premier versement (50%) NCH - ${sanitizedData.selectedOffer}`


            const paymentResult = await makeCIBTransaction({
                account: process.env.NEXT_PUBLIC_SOFIZPAY_API_KEY!,
                amount,
                full_name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
                phone: sanitizedData.phone,
                email: sanitizedData.email,
                memo: `Paiement NCH - ${sanitizedData.selectedOffer}`,
                return_url: `${baseUrl}/api/payment-callback?token=${sessionToken}`,
                redirect: 'yes',
            })

            if (!paymentResult.success) {
                // ✅ Nettoyer en cas d'échec avec Prisma
                await prisma.pendingRegistration.delete({
                    where: { sessionToken }
                })

                console.error('❌ Échec du paiement:', paymentResult.error)
                return NextResponse.json(
                    {
                        error: 'Échec du paiement: ' + paymentResult.error,
                        success: false
                    },
                    { status: 400 }
                )
            }

            // ✅ Retourner SEULEMENT l'URL de paiement
            console.log('✅ Paiement initié, redirection vers:', paymentResult.url)
            return NextResponse.json({
                success: true,
                paymentRequired: true,
                paymentUrl: paymentResult.url,
                message: 'Redirection vers le paiement...',
                // ✅ Retourner le mot de passe généré pour information (optionnel)
                paymentInfo: {
                    amount,
                    paymentType: sanitizedData.paymentType,
                    remainingAmount: sanitizedData.paymentType === 'partial' 
                        ? getAmountByOffer(sanitizedData.selectedOffer) * 0.5 
                        : 0
                },
                credentials: {
                    email: sanitizedData.email,
                    temporaryPassword: generatedPassword
                }
            })
        }

        console.log(sanitizedData)
        // ✅ Pour les autres méthodes, enregistrer directement
        const { client, password } = await createClient(sanitizedData)

        // ✅ Envoyer l'email avec les identifiants (optionnel)
        await sendCredentialsEmail(client.email, client.firstName, client.lastName, password)

        return NextResponse.json({
            success: true,
            message: 'Inscription réussie!',
            clientId: client.id,
            // ✅ Retourner les identifiants générés
            credentials: {
                email: client.email,
                password: password
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error("❌ Erreur inscription:", error)

        // ✅ Gestion des erreurs Prisma spécifiques
        if (error.code === 'P2002') {
            return NextResponse.json(
                {
                    error: "Un compte avec cet email existe déjà",
                    success: false,
                    errorCode: 'EMAIL_EXISTS'
                },
                { status: 400 }
            )
        }

        // ✅ Gestion des erreurs personnalisées
        if (error.message.includes('email existe déjà')) {
            return NextResponse.json(
                {
                    error: error.message,
                    success: false,
                    errorCode: 'EMAIL_EXISTS'
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            {
                error: "Erreur lors de l'inscription",
                success: false,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        )
    }
}

// ✅ Fonction de validation et sanitisation (mise à jour avec vérification email complète)
// Add this to your sanitizeAndValidate function in app/api/register/route.ts

async function sanitizeAndValidate(data: any) {
    const requiredFields = [
        'firstName', 'lastName', 'email', 'phone',
        'wilaya', 'diploma', 'selectedOffer', 'paymentMethod'
    ]

    // Vérifier les champs requis
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
        throw new Error(`Champs manquants: ${missingFields.join(', ')}`)
    }

    // ✅ Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
        throw new Error('Format d\'email invalide')
    }

    // ✅ Vérifier si l'email existe déjà
    const emailCheck = await checkEmailExists(data.email)

    if (emailCheck.exists) {
        let errorMessage = 'Un compte avec cet email existe déjà'

        switch (emailCheck.source) {
            case 'client':
                errorMessage = 'Un compte client avec cet email existe déjà. Vous pouvez vous connecter.'
                break
            case 'admin':
                errorMessage = 'Cet email est utilisé par un compte administrateur.'
                break
            case 'pending':
                errorMessage = 'Une inscription avec cet email est déjà en cours de traitement.'
                break
        }

        throw new Error(errorMessage)
    }

    // ✅ Validation du numéro de téléphone
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/
    if (!phoneRegex.test(data.phone)) {
        throw new Error('Format de téléphone invalide')
    }

    // ✅ NEW: Validate BaridiMob info if payment method is baridimob
    if (data.paymentMethod === 'baridimob') {
        if (!data.baridiMobInfo) {
            throw new Error('Informations CCP manquantes')
        }

        const { fullName, wilaya, rip, ccp, key } = data.baridiMobInfo

        if (!fullName || !wilaya || !rip || !ccp || !key) {
            throw new Error('Toutes les informations CCP sont obligatoires')
        }

        // Validate RIP (20 digits)
        if (!/^\d{20}$/.test(rip)) {
            throw new Error('Le RIP doit contenir exactement 20 chiffres')
        }

        // Validate Key (2 digits)
        if (!/^\d{2}$/.test(key)) {
            throw new Error('La clé doit contenir exactement 2 chiffres')
        }

        // Validate CCP (numeric)
        if (!/^\d+$/.test(ccp)) {
            throw new Error('Le numéro CCP doit contenir uniquement des chiffres')
        }
    }

    // ✅ Sanitiser les données
    const sanitizedData: any = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.replace(/\D/g, ''),
        wilaya: data.wilaya.trim(),
        diploma: data.diploma.trim(),
        selectedOffer: data.selectedOffer,
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType || 'partial',
        selectedCountries: data.selectedCountries || [],
        documents: data.documents || {},
        driveFolder: data.driveFolder
    }

    // ✅ Add BaridiMob info if present
    if (data.paymentMethod === 'baridimob' && data.baridiMobInfo) {
        sanitizedData.baridiMobInfo = {
            fullName: data.baridiMobInfo.fullName.trim(),
            wilaya: data.baridiMobInfo.wilaya.trim(),
            rip: data.baridiMobInfo.rip.trim(),
            ccp: data.baridiMobInfo.ccp.trim(),
            key: data.baridiMobInfo.key.trim()
        }
    }

    return sanitizedData
}