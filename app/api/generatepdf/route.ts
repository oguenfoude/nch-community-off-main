import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import puppeteer from "puppeteer";
import mammoth from "mammoth";
import { getTotalPrice } from "@/lib/constants/pricing";

// Fonction pour convertir DOCX en PDF via HTML
async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  let browser = null;
  let page = null;

  try {
    console.log('🔄 Conversion DOCX vers HTML...');

    // Convertir DOCX en HTML
    const result = await mammoth.convertToHtml({ buffer: docxBuffer });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 40px; 
              line-height: 1.6;
              color: #333;
            }
            .contract { 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px;
            }
            h1, h2 { 
              color: #2c3e50; 
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            .info-section {
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #3498db;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 200px;
              border-top: 1px solid #333;
              text-align: center;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="contract">
            ${result.value}
          </div>
        </body>
      </html>
    `;

    console.log('🚀 Lancement de Puppeteer...');

    // Configuration Puppeteer améliorée
    browser = await puppeteer.launch({
      headless: true,
      timeout: 30000, // ✅ Augmenter le timeout
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    page = await browser.newPage();

    // ✅ Augmenter les timeouts et améliorer la configuration
    await page.setDefaultTimeout(30000);
    await page.setDefaultNavigationTimeout(30000);

    console.log('📄 Chargement du contenu HTML...');
    await page.setContent(html, {
      waitUntil: 'domcontentloaded', // ✅ Changé de 'networkidle0' à 'domcontentloaded'
      timeout: 30000
    });

    // ✅ Attendre que la page soit prête
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('📄 Génération du PDF...');

    // Générer le PDF avec une meilleure configuration
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      timeout: 30000 // ✅ Ajouter timeout pour PDF
    });

    console.log('✅ PDF généré avec succès via Puppeteer');

    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('❌ Erreur conversion Puppeteer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Erreur conversion PDF: ${errorMessage}`);
  } finally {
    // ✅ Assurer la fermeture propre du navigateur
    try {
      if (page) {
        await page.close();
      }
      if (browser) {
        await browser.close();
      }
    } catch (closeError) {
      console.error('❌ Erreur fermeture Puppeteer:', closeError);
    }
  }
}

const getNumberEntreprises = (offer: string): string => {
  console.log("number entreprises : ", offer);
  switch (offer) {
    case 'basic': return "50"
    case 'premium': return "100"
    case 'gold': return "200"
    default: return "50"
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Récupérer les paramètres de l'URL
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || "Client NCH";
    const phone = searchParams.get('phone');
    const offer = searchParams.get('offer');
    const format = searchParams.get('format') || 'pdf'; // 'pdf' ou 'docx'
    const selectedCountries = searchParams.getAll('selectedCountries');
    console.log('📝 Paramètres reçus:', { name, phone, offer, format });

    // 2. Validation des paramètres
    if (!name || !phone || !offer || offer === 'undefined') {
      return NextResponse.json(
        { error: "Paramètres manquants ou invalides: name, phone, offer sont requis" },
        { status: 400 }
      );
    }

    // 3. Lire le fichier DOCX template
    // Remplacez la ligne 26 par :
    const templatePath = path.join(process.cwd(), "lib", "templates", "garantie-template.docx"); console.log('🔍 Chemin du template:', templatePath);

    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template DOCX non trouvé:', templatePath);

      // Debug: lister les fichiers
      try {
        const publicFiles = fs.readdirSync(path.join(process.cwd(), "public"));
        console.log('📁 Fichiers dans public:', publicFiles);
      } catch (err) {
        console.error('❌ Erreur lecture public:', err);
      }

      return NextResponse.json(
        { error: "Template DOCX non trouvé" },
        { status: 404 }
      );
    }

    console.log('📁 Lecture du template DOCX...');
    const content = fs.readFileSync(templatePath, "binary");

    // 4. Créer une instance PizZip avec le contenu du fichier
    const zip = new PizZip(content);

    // 5. Créer une instance Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const amount = getTotalPrice(offer);
    const entreprises = getNumberEntreprises(offer);
    console.log('💼 Nombre d\'entreprises pour l\'offre:', entreprises)
    console.log('💰 Montant pour l\'offre:', amount)
    console.log('🌍 Pays sélectionnés:', selectedCountries)
    // 6. Définir les données pour remplacer les placeholders
    const templateData = {
      name: name,
      phone: phone,
      email: searchParams.get('email') || '',
      address: searchParams.get('address') || '',
      amount: amount,
      pays: selectedCountries,
      entreprises: entreprises,
      offer: offer,
      offerDescription: searchParams.get('description') || 'Services NCH Community',
      contractDate: new Date().toLocaleDateString('fr-FR'),
      startDate: new Date().toLocaleDateString('fr-FR'),
      date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      companyName: "NCH Community",
      companyAddress: "Votre adresse",
      companyPhone: "Votre téléphone",
      companyEmail: "contact@nch-community.com",
      contractNumber: `NCH-${Date.now()}`,
      warrantyPeriod: "12 mois",
      paymentTerms: "30 jours",

    };

    console.log('🔄 Remplacement des placeholders...');

    // 7. Remplacer les placeholders avec les données
    doc.render(templateData);

    // 8. Générer le document DOCX modifié
    const docxBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    console.log('✅ Document DOCX généré avec succès');

    // 9. Convertir en PDF si demandé
    // if (format === 'pdf') {
    //   try {
    //     const pdfBuffer = await convertDocxToPdf(docxBuffer);

    //     return new NextResponse(pdfBuffer, {
    //       status: 200,
    //       headers: {
    //         'Content-Type': 'application/pdf',
    //         'Content-Disposition': 'attachment; filename="Contrat_Garantie_NCH.pdf"',
    //         'Content-Length': pdfBuffer.length.toString(),
    //       },
    //     });
    //   } catch (pdfError) {
    //     console.error('❌ Erreur conversion PDF:', pdfError);

    //     // Fallback: retourner le DOCX si la conversion échoue
    //     return new NextResponse(docxBuffer, {
    //       status: 200,
    //       headers: {
    //         'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    //         'Content-Disposition': 'attachment; filename="Contrat_Garantie_NCH.docx"',
    //         'Content-Length': docxBuffer.length.toString(),
    //       },
    //     });
    //   }
    // }

    // 10. Retourner le fichier DOCX
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Contrat_Garantie_NCH.docx"',
        'Content-Length': docxBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Erreur génération document:', error);
    const err = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      {
        error: "Erreur lors de la génération du document",
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      offer,
      email,
      address,
      description,
      format = 'pdf'
    } = body;

    console.log('📝 Données POST reçues:', body);

    // Validation des données
    if (!name || !phone || !offer) {
      return NextResponse.json(
        { error: "Données manquantes: name, phone, offer sont requis" },
        { status: 400 }
      );
    }

    // Lire le template
    const templatePath = path.join(process.cwd(), "public", "garantie-template.docx");

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Template DOCX non trouvé" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Données pour les placeholders
    const templateData = {
      clientName: name,
      clientPhone: phone,
      clientEmail: email || '',
      clientAddress: address || '',
      offerAmount: offer,
      offerDescription: description || 'Services NCH Community',
      contractDate: new Date().toLocaleDateString('fr-FR'),
      startDate: new Date().toLocaleDateString('fr-FR'),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      companyName: "NCH Community",
      companyAddress: "Votre adresse",
      companyPhone: "Votre téléphone",
      companyEmail: "contact@nch-community.com",
      contractNumber: `NCH-${Date.now()}`,
      warrantyPeriod: "12 mois",
      paymentTerms: "30 jours",
    };

    // Générer le document DOCX
    doc.render(templateData);
    const docxBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Convertir en PDF si demandé
    if (format === 'pdf') {
      try {
        const pdfBuffer = await convertDocxToPdf(docxBuffer);

        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="Contrat_Garantie_NCH.pdf"',
            'Content-Length': pdfBuffer.length.toString(),
          },
        });
      } catch (pdfError) {
        console.error('❌ Erreur conversion PDF:', pdfError);
        // Fallback vers DOCX
      }
    }

    // Retourner DOCX
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Contrat_Garantie_NCH.docx"',
        'Content-Length': docxBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Erreur génération document (POST):', error);
    const err = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      { error: "Erreur lors de la génération du document", details: err.message },
      { status: 500 }
    );
  }
}


