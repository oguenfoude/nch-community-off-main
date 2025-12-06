export interface Client {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    wilaya: string
    diploma: string
    selectedOffer: string
    paymentMethod: string
    selectedCountries: string[]
    status: "pending" | "processing" | "approved" | "rejected" | "completed"
    paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded"
    documents: {
        id?: string
        diploma?: string
        workCertificate?: string
        photo?: string
    }
    createdAt: string
    updatedAt: string

    // Payment tracking fields
    totalAmount?: number
    paidAmount?: number
    remainingAmount?: number
}

export type PaymentStatus = 'pending' | 'partially_paid' | 'completed' | 'failed'
