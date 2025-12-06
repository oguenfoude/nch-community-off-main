export interface Stage {
  id: number
  stageName: string
  status: 'completed' | 'in-progress' | 'pending' | 'not-started'
  documentsToUpload: string[]
  notes: string
}

export interface ClientStages {
  clientId: string
  stages: Stage[]
  currentStage: number
  lastUpdated: string
}

export const DEFAULT_STAGES: Stage[] = [
  {
    id: 1,
    stageName: "Inscription et création de compte",
    status: "completed",
    documentsToUpload: [],
    notes: "Compte créé avec succès"
  },
  {
    id: 2,
    stageName: "Confirmation des informations et création du profil professionnel",
    status: "in-progress",
    documentsToUpload: ["CV", "Lettre de motivation"],
    notes: "En attente de vérification"
  },
  {
    id: 3,
    stageName: "Téléchargement du profil professionnel",
    status: "pending",
    documentsToUpload: ["Portfolio", "Certificats"],
    notes: "Étape suivante après validation"
  },
  {
    id: 4,
    stageName: "Équivalence des certificats et diplômes",
    status: "not-started",
    documentsToUpload: ["Diplômes", "Relevés de notes"],
    notes: ""
  },
  {
    id: 5,
    stageName: "Correspondance intelligente avec les exigences des entreprises",
    status: "not-started",
    documentsToUpload: [],
    notes: "Analyse automatique en attente"
  },
  {
    id: 6,
    stageName: "Soumission aux entreprises",
    status: "not-started",
    documentsToUpload: [],
    notes: "En attente des étapes précédentes"
  }
]