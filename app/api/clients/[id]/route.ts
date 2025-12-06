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

    // ✅ Utiliser Prisma au lieu de Mongoose
    const client = await prisma.client.findUnique({
      where: { id }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ client })
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
        paymentMethod: body.paymentMethod,
        status: body.status,
        paymentStatus: body.paymentStatus,
        driveFolder: body.driveFolder,
        documents: body.documents,
        selectedCountries: body.selectedCountries || [],
      }
    })

    console.log('✅ Client mis à jour:', client.id)
    return NextResponse.json({ client })

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
