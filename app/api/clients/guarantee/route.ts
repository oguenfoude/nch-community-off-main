// app/api/clients/guarantee/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import axios from 'axios'
import FormData from 'form-data'
import { updateClientInSheet } from '@/lib/googleSheetsService'

/**
 * Generate personalized guarantee document and upload to Cloudinary
 * POST /api/clients/guarantee
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, email } = body

    if (!clientId && !email) {
      return NextResponse.json(
        { error: 'Client ID ou email requis' },
        { status: 400 }
      )
    }

    // 1. Fetch client data
    const client = await prisma.client.findFirst({
      where: clientId ? { id: clientId } : { email }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client non trouvé' },
        { status: 404 }
      )
    }

    // 2. Generate PDF from template
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const fullName = `${client.firstName} ${client.lastName}`
    
    const params = new URLSearchParams({
      name: fullName,
      phone: client.phone,
      offer: client.selectedOffer,
      format: 'pdf'
    })

    // Add selected countries
    client.selectedCountries.forEach((country: string) => {
      params.append('selectedCountries', country)
    })

    const pdfUrl = `${baseUrl}/api/generatepdf?${params.toString()}`
    
    console.log('📄 Génération du PDF:', pdfUrl)
    const pdfResponse = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 60000
    })

    if (pdfResponse.status !== 200) {
      throw new Error('Erreur lors de la génération du PDF')
    }

    const pdfBuffer = Buffer.from(pdfResponse.data)

    // 3. Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`
    
    const formData = new FormData()
    formData.append('file', pdfBuffer, {
      filename: `Garantie_${client.firstName}_${client.lastName}_${Date.now()}.pdf`,
      contentType: 'application/pdf'
    })
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'nch_uploads')
    formData.append('folder', `guarantees/${client.email}`)
    formData.append('resource_type', 'raw')

    console.log('☁️ Upload vers Cloudinary...')
    const uploadResponse = await axios.post(cloudinaryUrl, formData, {
      headers: formData.getHeaders(),
      timeout: 60000
    })

    const guaranteeUrl = uploadResponse.data.secure_url

    console.log('✅ Document de garantie uploadé:', guaranteeUrl)

    // 4. Update database
    await prisma.client.update({
      where: { id: client.id },
      data: {
        documents: {
          ...client.documents as any,
          guarantee: {
            url: guaranteeUrl,
            fileId: uploadResponse.data.public_id,
            name: `Garantie_${client.firstName}_${client.lastName}.pdf`,
            type: 'application/pdf'
          }
        }
      }
    })

    // 5. Update Google Sheets
    try {
      await updateClientInSheet(client.email, {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        wilaya: client.wilaya,
        diploma: client.diploma,
        selectedOffer: client.selectedOffer,
        selectedCountries: client.selectedCountries,
        paymentMethod: 'baridimob',
        paymentStatus: 'paid',
        documents: {
          ...client.documents as any,
          guarantee: { url: guaranteeUrl }
        }
      })
      console.log('✅ Google Sheets mis à jour avec le document de garantie')
    } catch (sheetError) {
      console.error('⚠️ Erreur Google Sheets (non-bloquant):', sheetError)
    }

    return NextResponse.json({
      success: true,
      guaranteeUrl,
      message: 'Document de garantie généré et enregistré'
    })

  } catch (error: any) {
    console.error('❌ Erreur génération garantie:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération du document',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
