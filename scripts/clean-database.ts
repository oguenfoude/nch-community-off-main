// scripts/clean-database.ts
// Run: npx ts-node scripts/clean-database.ts

import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('\n🧹 Starting database cleanup...\n')

  try {
    // 1. Delete all client stages
    const deletedStages = await prisma.clientStage.deleteMany({})
    console.log(`✅ Deleted ${deletedStages.count} client stages`)

    // 2. Delete all payments
    const deletedPayments = await prisma.payment.deleteMany({})
    console.log(`✅ Deleted ${deletedPayments.count} payments`)

    // 3. Delete all pending registrations
    const deletedPending = await prisma.pendingRegistration.deleteMany({})
    console.log(`✅ Deleted ${deletedPending.count} pending registrations`)

    // 4. Delete all clients (but keep admins!)
    const deletedClients = await prisma.client.deleteMany({})
    console.log(`✅ Deleted ${deletedClients.count} clients`)

    // 5. Show remaining admins
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, name: true, role: true }
    })
    console.log(`\n📋 Remaining admins (${admins.length}):`)
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`)
    })

    console.log('\n✨ Database cleanup completed successfully!')
    console.log('\n📊 Current database state:')
    
    const counts = {
      clients: await prisma.client.count(),
      payments: await prisma.payment.count(),
      pendingRegistrations: await prisma.pendingRegistration.count(),
      clientStages: await prisma.clientStage.count(),
      admins: await prisma.admin.count()
    }
    
    console.log(`   - Clients: ${counts.clients}`)
    console.log(`   - Payments: ${counts.payments}`)
    console.log(`   - Pending Registrations: ${counts.pendingRegistrations}`)
    console.log(`   - Client Stages: ${counts.clientStages}`)
    console.log(`   - Admins: ${counts.admins}`)

  } catch (error) {
    console.error('❌ Error cleaning database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
