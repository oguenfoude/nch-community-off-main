// scripts/create-admin.js
const bcrypt = require("bcryptjs")
const { PrismaClient } = require("@prisma/client")
require('dotenv').config({ path: '.env.local' })

// ✅ Utiliser Prisma Client au lieu de Mongoose
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function createAdmin() {
  try {
    // ✅ Prisma se connecte automatiquement, pas besoin de connect()
    console.log("🔌 Connexion à MongoDB via Prisma...")

    // ✅ Vérifier si l'admin existe déjà avec Prisma
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: "admin@nch-community.com" }
    })

    if (existingAdmin) {
      console.log("⚠️ Admin existe déjà!")
      console.log("Email: admin@nch-community.com")
      console.log("Mot de passe: admin123")
      return
    }

    // ✅ Créer le mot de passe hashé
    const hashedPassword = await bcrypt.hash("admin123", 12)

    // ✅ Créer l'admin avec Prisma
    const admin = await prisma.admin.create({
      data: {
        email: "admin@nch-community.com",
        password: hashedPassword,
        name: "Admin NCH",
        role: "SUPER_ADMIN",  // ✅ Enum en majuscules selon le schéma Prisma
        isActive: true,
      }
    })

    console.log("✅ Admin créé avec succès!")
    console.log("📧 Email: admin@nch-community.com")
    console.log("🔑 Mot de passe: admin123")
    console.log("🆔 ID Admin:", admin.id)

    process.exit(0)
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin:", error)

    // ✅ Gestion des erreurs Prisma spécifiques
    if (error.code === 'P2002') {
      console.error("🔄 L'email existe déjà dans la base de données")
    }

    if (error.code === 'P1001') {
      console.error("🔌 Problème de connexion à la base de données")
      console.error("💡 Vérifiez votre DATABASE_URL dans .env.local")
    }

    process.exit(1)
  } finally {
    // ✅ Fermer la connexion Prisma
    await prisma.$disconnect()
    console.log("🔌 Connexion Prisma fermée")
  }
}

createAdmin()
