// scripts/test-prisma-connection.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function testPrismaConnection() {
    console.log('🧪 Test de connexion Prisma avec MongoDB...\n')

    try {
        // Test 1: Connexion de base
        console.log('1️⃣ Test de connexion...')
        await prisma.$connect()
        console.log('✅ Connexion Prisma réussie!')

        // Test 2: Vérifier la base de données
        console.log('\n2️⃣ Test de la base de données...')
        const result = await prisma.$runCommandRaw({
            ping: 1
        })
        console.log('✅ Ping DB réussi:', result)

        // Test 3: Lister les collections existantes
        console.log('\n3️⃣ Collections existantes...')
        try {
            const collections = await prisma.$runCommandRaw({
                listCollections: 1
            })
            console.log('📦 Collections:', collections)
        } catch (error) {
            console.log('ℹ️ Pas de collections existantes ou erreur:', error.message)
        }

        // Test 4: Créer un utilisateur test
        console.log('\n4️⃣ Test création utilisateur...')
        const testUser = await prisma.user.create({
            data: {
                email: `test-${Date.now()}@example.com`,
                name: 'Test User'
            }
        })
        console.log('✅ Utilisateur créé:', testUser)

        // Test 5: Lire l'utilisateur créé
        console.log('\n5️⃣ Test lecture utilisateur...')
        const foundUser = await prisma.user.findUnique({
            where: { id: testUser.id }
        })
        console.log('✅ Utilisateur trouvé:', foundUser)

        // Test 6: Créer un film test
        console.log('\n6️⃣ Test création film...')
        const testMovie = await prisma.movie.create({
            data: {
                title: 'Film Test',
                description: 'Description du film test',
                genre: 'Action',
                releaseYear: 2024,
                rating: 8.5
            }
        })
        console.log('✅ Film créé:', testMovie)

        // Test 7: Lister tous les utilisateurs
        console.log('\n7️⃣ Test liste utilisateurs...')
        const allUsers = await prisma.user.findMany()
        console.log('✅ Tous les utilisateurs:', allUsers)

        // Test 8: Lister tous les films
        console.log('\n8️⃣ Test liste films...')
        const allMovies = await prisma.movie.findMany()
        console.log('✅ Tous les films:', allMovies)

        // Test 9: Mise à jour
        console.log('\n9️⃣ Test mise à jour...')
        const updatedUser = await prisma.user.update({
            where: { id: testUser.id },
            data: { name: 'Test User Updated' }
        })
        console.log('✅ Utilisateur mis à jour:', updatedUser)

        // Test 10: Nettoyage (supprimer les données test)
        console.log('\n🧹 Nettoyage des données test...')
        await prisma.user.delete({
            where: { id: testUser.id }
        })
        await prisma.movie.delete({
            where: { id: testMovie.id }
        })
        console.log('✅ Données test supprimées')

        console.log('\n🎉 Tous les tests Prisma réussis!')

    } catch (error) {
        console.error('\n❌ Erreur lors du test:', error)

        if (error.code === 'P1001') {
            console.error('🔌 Problème de connexion à la base de données')
            console.error('💡 Vérifiez votre DATABASE_URL dans .env.local')
        }

        if (error.code === 'P2002') {
            console.error('🔄 Contrainte d\'unicité violée')
        }

        if (error.message.includes('authentication')) {
            console.error('🔐 Problème d\'authentification MongoDB')
            console.error('💡 Vérifiez vos credentials dans l\'URI')
        }

    } finally {
        await prisma.$disconnect()
        console.log('\n🔌 Connexion Prisma fermée')
    }
}

// Exécuter le test
testPrismaConnection()