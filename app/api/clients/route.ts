import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // ✅ Construire les filtres Prisma
    const where: any = {}

    // ✅ Recherche textuelle avec Prisma
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { wilaya: { contains: search, mode: 'insensitive' } },
        { diploma: { contains: search, mode: 'insensitive' } }
      ]
    }

    // ✅ Filtres de statut
    if (status && status !== 'all') {
      where.status = status
    }

    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus
    }

    // ✅ Construire l'objet de tri Prisma
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc'

    // ✅ Calculer le skip pour la pagination
    const skip = (page - 1) * limit

    // ✅ Exécuter les requêtes en parallèle avec Prisma
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.client.count({ where })
    ])

    // ✅ Calculer les métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // ✅ Enrichir les clients avec les informations de paiement
    const enrichedClients = clients.map(client => {
      const payments = client.payments || []
      const totalPaid = payments.filter(p => p.status === 'verified' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
      const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
      const hasPayments = payments.length > 0
      
      let paymentStatus = 'unpaid'
      if (totalPaid > 0 && totalPending === 0) {
        paymentStatus = 'paid'
      } else if (totalPaid > 0 && totalPending > 0) {
        paymentStatus = 'partially_paid'
      } else if (totalPending > 0) {
        paymentStatus = 'pending'
      }

      return {
        ...client,
        paymentStatus,
        paymentMethod: payments[0]?.paymentMethod || null,
        totalAmount: totalPaid + totalPending,
        paidAmount: totalPaid,
        remainingAmount: totalPending
      }
    })

    console.log("clients enriched with payment info")
    return NextResponse.json({
      clients: enrichedClients,
      currentPage: page,
      totalPages,
      total: totalCount,
      limit,
      hasNextPage,
      hasPrevPage,
      // Pour compatibilité avec les composants existants
      pagination: {
        currentPage: page,
        totalPages,
        total: totalCount,
        limit
      }
    })
  } catch (error: any) {
    console.error("❌ Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()

    // ✅ Validation des données requises
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'wilaya', 'diploma', 'selectedOffer', 'paymentMethod']
    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Champs manquants: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // ✅ Vérifier si l'email existe déjà avec Prisma




    // ✅ Créer le client avec Prisma
    const client = await prisma.client.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        wilaya: body.wilaya,
        diploma: body.diploma,
        password: body.password || 'TEMP_PASSWORD', // Plain text for MVP
        selectedOffer: body.selectedOffer,
        // Note: paymentMethod/paymentStatus now on Payment model
        status: body.status || 'pending',
        selectedCountries: body.selectedCountries || [],
        driveFolder: body.driveFolder ? {
          name: body.driveFolder.name,
          id: body.driveFolder.id
        } : undefined,
        documents: body.documents || {}
      }
    })

    return NextResponse.json(client, { status: 201 })

  } catch (error: any) {
    console.error("❌ Error creating client:", error)

    // ✅ Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "Un client avec cet email existe déjà" },
        { status: 400 }
      )
    }

    if (error.code === 'P2001') {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || "Failed to create client" },
      { status: 500 }
    )
  }
}
