// scripts/test-connection.js
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

async function testConnection() {
    console.log('🧪 Test de diagnostic MongoDB Atlas...')

    // Test 1: Vérifier l'URI
    console.log('📋 URI:', uri.substring(0, 50) + '...')

    // Test 2: Vérifier la résolution DNS
    try {
        const dns = require('dns').promises
        console.log('🔍 Test résolution DNS...')
        const result = await dns.lookup('scene.merhe.mongodb.net')
        console.log('✅ DNS résolu:', result.address)
    } catch (error) {
        console.error('❌ Erreur DNS:', error.message)
    }

    // Test 3: Tentative de connexion
    try {
        console.log('🔌 Test connexion MongoDB...')

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 20000,
            family: 4,
            ssl: true,
            tls: true,
        })

        console.log('✅ Connexion réussie!')

        // Test 4: Opération simple
        const db = mongoose.connection.db
        const collections = await db.listCollections().toArray()
        console.log('📦 Collections:', collections.map(c => c.name))

        // Test 5: Créer un document test
        const testCollection = db.collection('test')
        const testDoc = await testCollection.insertOne({ test: true, timestamp: new Date() })
        console.log('✅ Test write réussi:', testDoc.insertedId)

        // Nettoyer
        await testCollection.deleteOne({ _id: testDoc.insertedId })
        console.log('🧹 Nettoyage effectué')

    } catch (error) {
        console.error('❌ Erreur connexion:', error.message)

        if (error.message.includes('IP')) {
            console.error('\n🚫 PROBLÈME IP DETECTÉ')
            console.error('💡 Solutions:')
            console.error('1. Connectez-vous à MongoDB Atlas')
            console.error('2. Allez dans "Network Access"')
            console.error('3. Cliquez "Add IP Address"')
            console.error('4. Sélectionnez "Add Current IP Address"')
            console.error('5. Ou ajoutez 0.0.0.0/0 pour autoriser toutes les IPs')
        }

        if (error.message.includes('authentication')) {
            console.error('\n🔐 PROBLÈME AUTHENTIFICATION')
            console.error('💡 Vérifiez vos credentials dans Database Access')
        }
    } finally {
        await mongoose.disconnect()
        console.log('🔌 Connexion fermée')
    }
}

testConnection()