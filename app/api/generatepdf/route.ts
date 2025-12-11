import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import { getTotalPrice } from "@/lib/constants/pricing";

// ==========================================
// HELPER FUNCTIONS - Clear responsibilities
// ==========================================

/**
 * Get number of companies based on offer type
 */
const getNumberEntreprises = (offer: string): string => {
  switch (offer) {
    case 'basic': return "50"
    case 'premium': return "100"
    case 'gold': return "200"
    default: return "50"
  }
}

/**
 * Get the template file path
 */
const getTemplatePath = (): string => {
  return path.join(process.cwd(), "public", "garenttie.docx");
}

/**
 * Generate DOCX document from template with client data
 * Uses find-and-replace on XML content for reliable placeholder substitution
 */
const generateDocxFromTemplate = (
  templatePath: string,
  data: {
    name: string;
    phone: string;
    offer: string;
    selectedCountries: string[];
  }
): Buffer => {
  console.log('📁 Reading template...');
  const content = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(content);

  // Derive clean first/last names (avoid double repeats)
  const parts = (data.name || '').trim().split(/\s+/);
  const firstName = parts[0] || data.name || 'Client';
  const lastName = parts.slice(1).join(' ');
  const displayName = [firstName, lastName].filter(Boolean).join(' ');

  // Prepare replacement data
  const amount = getTotalPrice(data.offer);
  const entreprises = getNumberEntreprises(data.offer);
  const paysListe = data.selectedCountries.length > 0 
    ? data.selectedCountries.join(', ') 
    : 'les pays choisis selon votre offre';
  const nombrePays = data.selectedCountries.length > 0 
    ? data.selectedCountries.length.toString() 
    : 'plusieurs';

  // Create replacement map for the new simplified placeholder format
  // Using String.fromCharCode for the curly apostrophe (') to ensure exact match
  const apostrophe = String.fromCharCode(8217);
  const replacements: Record<string, string> = {
    "(fullname)": displayName,
    "(telephone)": data.phone,
    [`(nombre de pays mentionne dans l${apostrophe}offre)`]: nombrePays,
    "(les pays mentionnée)": paysListe,
    "(les pays mentionnee)": paysListe,
    "(nombre d'entreprises)": entreprises,
    "(le montant)": `${amount}`,
    "(la date)": new Date().toLocaleDateString('fr-FR'),
  };

  console.log('🔄 Replacement data prepared:', {
    displayName,
    phone: data.phone,
    nombrePays,
    paysListe,
    amount,
    date: new Date().toLocaleDateString('fr-FR')
  });

  console.log('🔄 Replacing placeholders in <w:t> nodes');

  // Get main document content
  let docContent = zip.file("word/document.xml")?.asText() || "";

  // First pass: Clean up split placeholders by removing XML tags between placeholder parts
  // Fix "(le </w:t>...<w:t>montant)" → "(le montant)"
  docContent = docContent.replace(/\(le<\/w:t>[\s\S]*?<w:t[^>]*>\s*montant\)/gi, '(le montant)');
  // Fix "(la </w:t>...<w:t>date)" → "(la date)"
  docContent = docContent.replace(/\(la<\/w:t>[\s\S]*?<w:t[^>]*>\s*date\)/gi, '(la date)');
  
  // Second pass: Replace inside text nodes
  let updatedContent = docContent.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g, (full, text) => {
    let newText = text;
    for (const [needle, value] of Object.entries(replacements)) {
      if (newText.includes(needle)) {
        newText = newText.split(needle).join(value);
      }
    }
    return full.replace(text, newText);
  });

  // Third pass: Global replacement for any remaining placeholders
  for (const [needle, value] of Object.entries(replacements)) {
    if (updatedContent.includes(needle)) {
      updatedContent = updatedContent.split(needle).join(value);
      console.log(`  ✓ Global replaced "${needle}" → "${value}"`);
    }
  }

  // Update the zip with modified content
  zip.file("word/document.xml", updatedContent);

  // Generate buffer
  const docxBuffer = zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  console.log('✅ Document generated successfully with all placeholders replaced');
  return docxBuffer;
}

// ==========================================
// API ENDPOINT
// ==========================================

export async function GET(req: NextRequest) {
  try {
    // 1. Get and validate parameters
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || "Client NCH";
    const phone = searchParams.get('phone');
    const offer = searchParams.get('offer');
    const selectedCountries = searchParams.getAll('selectedCountries');
    
    console.log('📝 Request params:', { name, phone, offer });

    if (!name || !phone || !offer || offer === 'undefined') {
      return NextResponse.json(
        { error: "Missing or invalid parameters: name, phone, offer are required" },
        { status: 400 }
      );
    }

    // 2. Check template exists
    const templatePath = getTemplatePath();
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template not found:', templatePath);
      return NextResponse.json(
        { error: "Template file not found" },
        { status: 404 }
      );
    }

    // 3. Generate DOCX
    const docxBuffer = generateDocxFromTemplate(templatePath, {
      name,
      phone,
      offer,
      selectedCountries
    });

    // 4. Return DOCX document
    return new NextResponse(docxBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="Contrat_Garantie_NCH.docx"',
        'Content-Length': docxBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Document generation error:', error);
    const err = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      {
        error: "Error generating document",
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      },
      { status: 500 }
    );
  }
}

