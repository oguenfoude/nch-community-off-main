import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all stages for the authenticated client
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Find the client by email
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        stages: {
          orderBy: { stageNumber: 'asc' }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // If no stages exist, create default stages
    if (client.stages.length === 0) {
      const stageDefinitions = [
        {
          stageNumber: 1,
          stageName: 'Inscription et création de compte',
          status: 'completed',
          requiredDocuments: [],
          notes: 'Compte créé avec succès'
        },
        {
          stageNumber: 2,
          stageName: 'Confirmation des informations et création du profil professionnel',
          status: 'in_progress',
          requiredDocuments: ['CV', 'Lettre de motivation'],
          notes: 'En attente de vérification'
        },
        {
          stageNumber: 3,
          stageName: 'Téléchargement du profil professionnel',
          status: 'not_started',
          requiredDocuments: ['Portfolio', 'Certificats'],
          notes: 'Étape suivante après validation'
        },
        {
          stageNumber: 4,
          stageName: 'Équivalence des certificats et diplômes',
          status: 'not_started',
          requiredDocuments: ['Diplômes', 'Relevés de notes'],
          notes: ''
        },
        {
          stageNumber: 5,
          stageName: 'Correspondance intelligente avec les exigences des entreprises',
          status: 'not_started',
          requiredDocuments: [],
          notes: 'Analyse automatique en attente'
        },
        {
          stageNumber: 6,
          stageName: 'Soumission aux entreprises',
          status: 'not_started',
          requiredDocuments: [],
          notes: 'En attente des étapes précédentes'
        }
      ]

      // Create all stages
      const createdStages = await Promise.all(
        stageDefinitions.map(stage =>
          prisma.clientStage.create({
            data: {
              clientId: client.id,
              ...stage
            }
          })
        )
      )

      return NextResponse.json({
        success: true,
        stages: createdStages
      })
    }

    return NextResponse.json({
      success: true,
      stages: client.stages
    })
  } catch (error) {
    console.error('Error fetching stages:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Update a specific stage (for client self-updates if needed)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { stageNumber, status, notes, requiredDocuments } = body

    // Find the client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // Validate stage number
    if (!stageNumber || stageNumber < 1 || stageNumber > 6) {
      return NextResponse.json(
        { success: false, error: 'Numéro d\'étape invalide' },
        { status: 400 }
      )
    }

    // Validate status if provided
    const validStatuses = ['not_started', 'in_progress', 'pending_review', 'completed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // Check if stage exists
    const existingStage = await prisma.clientStage.findFirst({
      where: {
        clientId: client.id,
        stageNumber
      }
    })

    if (!existingStage) {
      return NextResponse.json(
        { success: false, error: 'Étape non trouvée' },
        { status: 404 }
      )
    }

    // Update the stage
    const updatedStage = await prisma.clientStage.update({
      where: { id: existingStage.id },
      data: {
        status: status || existingStage.status,
        notes: notes !== undefined ? notes : existingStage.notes,
        requiredDocuments: requiredDocuments || existingStage.requiredDocuments,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      stage: updatedStage,
      message: 'Étape mise à jour avec succès'
    })
  } catch (error) {
    console.error('Error updating stage:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}