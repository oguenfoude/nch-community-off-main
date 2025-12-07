import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { requireAdmin } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    // ✅ Attendre les params (Next.js 15)
    const { id } = await params

    // ✅ Utiliser Prisma au lieu de Mongoose avec les paiements
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // ✅ Enrichir avec les informations de paiement
    const payments = client.payments || []
    const totalPaid = payments.filter(p => p.status === 'verified' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    
    let paymentStatus = 'unpaid'
    if (totalPaid > 0 && totalPending === 0) {
      paymentStatus = 'paid'
    } else if (totalPaid > 0 && totalPending > 0) {
      paymentStatus = 'partially_paid'
    } else if (totalPending > 0) {
      paymentStatus = 'pending'
    }

    const enrichedClient = {
      ...client,
      paymentStatus,
      paymentMethod: payments[0]?.paymentMethod || null,
      totalAmount: totalPaid + totalPending,
      paidAmount: totalPaid,
      remainingAmount: totalPending
    }

    return NextResponse.json(enrichedClient)
  } catch (error: any) {
    console.error("GET /api/clients/[id] error:", error)

    // ✅ Gestion des erreurs Prisma
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    // ✅ Attendre les params (Next.js 15)
    const { id } = await params
    const body = await request.json()

    console.log('🔄 Mise à jour client:', id, body)

    // ✅ Utiliser Prisma update au lieu de Mongoose
    const client = await prisma.client.update({
      where: { id },
      data: {
        // ✅ Mapper les champs selon ton schéma Prisma
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        wilaya: body.wilaya,
        diploma: body.diploma,
        selectedOffer: body.selectedOffer,
        // Note: paymentMethod is now on Payment model, not Client
        status: body.status,
        driveFolder: body.driveFolder,
        documents: body.documents,
        selectedCountries: body.selectedCountries || [],
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // ✅ Enrichir avec les informations de paiement
    const payments = client.payments || []
    const totalPaid = payments.filter(p => p.status === 'verified' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    
    let paymentStatus = 'unpaid'
    if (totalPaid > 0 && totalPending === 0) {
      paymentStatus = 'paid'
    } else if (totalPaid > 0 && totalPending > 0) {
      paymentStatus = 'partially_paid'
    } else if (totalPending > 0) {
      paymentStatus = 'pending'
    }

    const enrichedClient = {
      ...client,
      paymentStatus,
      paymentMethod: payments[0]?.paymentMethod || null,
      totalAmount: totalPaid + totalPending,
      paidAmount: totalPaid,
      remainingAmount: totalPending
    }

    console.log('✅ Client mis à jour:', client.id)
    return NextResponse.json(enrichedClient)

  } catch (error: any) {
    console.error("PUT /api/clients/[id] error:", error)

    // ✅ Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    const { id } = await params
    const body = await request.json()

    console.log('🔄 Mise à jour partielle client:', id, body)

    const client = await prisma.client.update({
      where: { id },
      data: body,
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // ✅ Enrichir avec les informations de paiement
    const payments = client.payments || []
    const totalPaid = payments.filter(p => p.status === 'verified' || p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
    
    let paymentStatus = 'unpaid'
    if (totalPaid > 0 && totalPending === 0) {
      paymentStatus = 'paid'
    } else if (totalPaid > 0 && totalPending > 0) {
      paymentStatus = 'partially_paid'
    } else if (totalPending > 0) {
      paymentStatus = 'pending'
    }

    const enrichedClient = {
      ...client,
      paymentStatus,
      paymentMethod: payments[0]?.paymentMethod || null,
      totalAmount: totalPaid + totalPending,
      paidAmount: totalPaid,
      remainingAmount: totalPending
    }

    console.log('✅ Client mis à jour:', client.id)
    return NextResponse.json(enrichedClient)

  } catch (error: any) {
    console.error("PATCH /api/clients/[id] error:", error)

    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request)

    // ✅ Attendre les params (Next.js 15)
    const { id } = await params

    // ✅ Utiliser Prisma delete au lieu de Mongoose
    const client = await prisma.client.delete({
      where: { id }
    })

    console.log('🗑️ Client supprimé:', id)
    return NextResponse.json({
      message: "Client deleted successfully",
      deletedClient: {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        email: client.email
      }
    })

  } catch (error: any) {
    console.error("DELETE /api/clients/[id] error:", error)

    // ✅ Gestion des erreurs Prisma
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
