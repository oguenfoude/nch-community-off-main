// Créer un modèle pour les inscriptions temporaires
// models/PendingRegistration.ts
import mongoose, { Schema, Document } from 'mongoose'

interface IPendingRegistration extends Document {
    sessionToken: string
    registrationData: any
    paymentDetails: any
    status: 'pending' | 'paid' | 'expired'
}

const pendingRegistrationSchema = new Schema({
    sessionToken: { type: String, required: true, unique: true },
    registrationData: { type: Object, required: true },
    paymentDetails: { type: Object, required: true },
    status: { type: String, enum: ['pending', 'paid', 'expired'], default: 'pending' },
})

export default mongoose.models.PendingRegistration || mongoose.model<IPendingRegistration>('PendingRegistration', pendingRegistrationSchema)