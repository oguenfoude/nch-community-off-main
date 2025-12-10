// Document object stored in client
export interface DocumentInfo {
    url?: string
    fileId?: string
    name?: string
    type?: string
    size?: number
}

export interface Client {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    wilaya: string
    diploma: string
    password: string  // Plain text password for MVP
    selectedOffer: string
    selectedCountries: string[]
    status: "pending" | "processing" | "approved" | "rejected" | "completed"
    
    // Documents and Drive folder
    documents: {
        id?: DocumentInfo | string
        diploma?: DocumentInfo | string
        workCertificate?: DocumentInfo | string
        photo?: DocumentInfo | string
        [key: string]: DocumentInfo | string | undefined
    }
    driveFolder?: {
        id?: string
        name?: string
        url?: string
    } | null
    
    // Payment tracking (from Payment relation)
    paymentStatus?: "unpaid" | "pending" | "paid" | "failed" | "refunded" | "partially_paid"
    paymentMethod?: string
    totalAmount?: number
    paidAmount?: number
    remainingAmount?: number
    
    // Relations
    payments?: Payment[]
    stages?: ClientStage[]
    
    createdAt: string
    updatedAt: string
}

export interface Payment {
    id: string
    clientId: string
    paymentType: 'initial' | 'second'
    paymentMethod: string
    amount: number
    status: 'pending' | 'verified' | 'completed' | 'failed'
    transactionId?: string | null
    orderId?: string | null
    gatewayResponse?: Record<string, unknown> | null
    baridiMobInfo?: {
        fullName?: string
        phoneNumber?: string
        wilaya?: string
        rip?: string
        ccp?: string
        key?: string
        receiptNumber?: string
    } | null
    receiptUrl?: string | null
    verifiedBy?: string | null
    verifiedAt?: string | null
    createdAt: string
    updatedAt: string
}

export interface ClientStage {
    id: string
    clientId: string
    stageName: string
    stageNumber: number
    status: 'not_started' | 'in_progress' | 'completed'
    startedAt?: string | null
    completedAt?: string | null
    notes?: string | null
    createdAt: string
    updatedAt: string
}

export type PaymentStatus = 'pending' | 'partially_paid' | 'completed' | 'failed'
