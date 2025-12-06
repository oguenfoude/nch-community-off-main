// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// ✅ Extension pour ajouter des méthodes comme comparePassword
export const adminHelpers = {
    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(12)
        return bcrypt.hash(password, salt)
    },

    async comparePassword(candidatePassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, hashedPassword)
    },

    async createAdmin(data: {
        email: string
        password: string
        name: string
        role?: 'ADMIN' | 'SUPER_ADMIN'
    }) {
        const hashedPassword = await this.hashPassword(data.password)
        return prisma.admin.create({
            data: {
                ...data,
                password: hashedPassword,
            }
        })
    }
}