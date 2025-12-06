import mongoose from "mongoose"
export interface IClientStage {
  id: string
  stageNumber: number
  stageName: string
  status: 'completed' | 'in-progress' | 'pending' | 'not-started'
  documents: string[]
  notes: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}
export interface IClient extends mongoose.Document {
  firstName: string
  lastName: string
  email: string
  phone: string
  wilaya: string
  diploma: string
  selectedOffer: "basic" | "premium" | "gold"
  paymentMethod: "cib" | "edahabia" | "later"
  status: "pending" | "processing" | "approved" | "rejected" | "completed"
  paymentStatus: "unpaid" | "pending" | "paid" | "failed" | "refunded"
  stages?: IClientStage[]


  // Payment tracking
  totalAmount?: number
  paidAmount?: number
  remainingAmount?: number

  // ✅ NOUVEAU : Dossier Google Drive
  driveFolder: {
    name: string // Nom du dossier (ex: "Jean-Dupont-12345")
    id?: string // ID du dossier Google Drive
  }

  // ✅ MISE À JOUR : Documents avec Google Drive
  documents: {
    id?: {
      fileId: string // ID Google Drive
      url: string // Lien de visualisation
      downloadUrl: string // Lien de téléchargement
      name: string // Nom du fichier
      size: string // Taille du fichier
    }
    diploma?: {
      fileId: string
      url: string
      downloadUrl: string
      name: string
      size: string
    }
    workCertificate?: {
      fileId: string
      url: string
      downloadUrl: string
      name: string
      size: string
    }
    photo?: {
      fileId: string
      url: string
      downloadUrl: string
      name: string
      size: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

const ClientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    wilaya: {
      type: String,
      required: [true, "Wilaya is required"],
    },
    diploma: {
      type: String,
      required: [true, "Diploma is required"],
    },
    selectedOffer: {
      type: String,
      enum: ["basic", "premium", "gold"],
      required: [true, "Selected offer is required"],
    },
    paymentMethod: {
      type: String,
      enum: ["cib", "edahabia", "later"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded"],
      default: "unpaid",
    },

    // ✅ NOUVEAU : Dossier Google Drive
    driveFolder: {
      type: {
        name: { type: String, required: true },
        id: { type: String, default: null },
      },
      required: false,
      default: null
    },

    // ✅ MISE À JOUR : Structure documents
    documents: {
      type: {
        id: {
          type: {
            fileId: { type: String },
            url: { type: String },
            downloadUrl: { type: String },
            name: { type: String },
            size: { type: String },
          },
          default: null,
        },
        diploma: {
          type: {
            fileId: { type: String },
            url: { type: String },
            downloadUrl: { type: String },
            name: { type: String },
            size: { type: String },
          },
          default: null,
        },
        workCertificate: {
          type: {
            fileId: { type: String },
            url: { type: String },
            downloadUrl: { type: String },
            name: { type: String },
            size: { type: String },
          },
          default: null,
        },
        photo: {
          type: {
            fileId: { type: String },
            url: { type: String },
            downloadUrl: { type: String },
            name: { type: String },
            size: { type: String },
          },
          default: null,
        },
      },
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema)
