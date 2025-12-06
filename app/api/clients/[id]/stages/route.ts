// app/api/clients/[id]/stages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all stages for a client (ADMIN)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Attendre les params (Next.js 15)
    const { id } = await params
    
    const session = await getServerSession(authOptions)

    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const stages = await prisma.clientStage.findMany({
      where: { clientId: id },
      orderBy: { stageNumber: 'asc' }
    })

    return NextResponse.json({
      success: true,
      stages
    })
  } catch (error) {
    console.error('Error fetching stages:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Initialize all stages for a client (ADMIN)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Attendre les params (Next.js 15)
    const { id } = await params
    
    const session = await getServerSession(authOptions)

    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Check if stages already exist
    const existingStages = await prisma.clientStage.findMany({
      where: { clientId: id }
    })

    if (existingStages.length > 0) {
      return NextResponse.json({
        success: true,
        stages: existingStages,
        message: 'Les étapes existent déjà'
      })
    }

    // Define all 6 stages
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
    const stages = await Promise.all(
      stageDefinitions.map(stage =>
        prisma.clientStage.create({
          data: {
            clientId: id,
            ...stage
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      stages,
      message: 'Étapes initialisées avec succès'
    })
  } catch (error) {
    console.error('Error initializing stages:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'initialisation' },
      { status: 500 }
    )
  }
}

// PUT - Update a specific stage (ADMIN)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Attendre les params (Next.js 15)
    const { id } = await params
    
    const session = await getServerSession(authOptions)

    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { stageNumber, status, notes, requiredDocuments } = body

    // Validate stage number
    if (!stageNumber || stageNumber < 1 || stageNumber > 6) {
      return NextResponse.json(
        { success: false, error: 'Numéro d\'étape invalide' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['not_started', 'in_progress', 'pending_review', 'completed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Statut invalide' },
        { status: 400 }
      )
    }

    // ✅ FIX: Ajouter le stageName depuis les définitions
    const stageDefinitions = [
      { number: 1, name: 'Inscription et création de compte' },
      { number: 2, name: 'Confirmation des informations et création du profil professionnel' },
      { number: 3, name: 'Téléchargement du profil professionnel' },
      { number: 4, name: 'Équivalence des certificats et diplômes' },
      { number: 5, name: 'Correspondance intelligente avec les exigences des entreprises' },
      { number: 6, name: 'Soumission aux entreprises' }
    ]

    const stageDef = stageDefinitions.find(s => s.number === stageNumber)
    const stageName = stageDef?.name || `Étape ${stageNumber}`

    // Check if stage exists
    const existingStage = await prisma.clientStage.findFirst({
      where: {
        clientId: id,
        stageNumber
      }
    })

    let updatedStage

    if (existingStage) {
      // Update existing stage
      updatedStage = await prisma.clientStage.update({
        where: { id: existingStage.id },
        data: {
          status: status || existingStage.status,
          notes: notes !== undefined ? notes : existingStage.notes,
          requiredDocuments: requiredDocuments || existingStage.requiredDocuments,
          updatedAt: new Date()
        }
      })
    } else {
      // ✅ FIX: Create new stage WITH stageName
      updatedStage = await prisma.clientStage.create({
        data: {
          clientId: id,
          stageNumber,
          stageName, // ✅ AJOUT DU CHAMP MANQUANT
          status: status || 'not_started',
          notes: notes || '',
          requiredDocuments: requiredDocuments || []
        }
      })
    }

    return NextResponse.json({
      success: true,
      stage: updatedStage,
      message: 'Étape mise à jour avec succès'
    })
  } catch (error) {
    console.error('Error updating stage:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}