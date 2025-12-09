import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

/**
 * Auth.js v5 Configuration
 */
const config: NextAuthConfig = {
  providers: [
    // Admin Provider
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Dynamic import to avoid Edge Runtime issues
          const { prisma } = await import("@/lib/prisma")
          const { adminHelpers } = await import("@/lib/prisma")
          
          const admin = await prisma.admin.findUnique({
            where: { email: String(credentials.email).toLowerCase().trim() }
          })

          if (!admin || !admin.isActive) {
            return null
          }

          const isValid = await adminHelpers.comparePassword(
            String(credentials.password),
            admin.password
          )

          if (!isValid) {
            return null
          }

          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() }
          })

          const userData = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            userType: "admin" as const
          }
          
          console.log("✅ Admin authorized:", userData)
          return userData
        } catch (error) {
          console.error("❌ Admin auth error:", error)
          return null
        }
      }
    }),

    // Client Provider
    Credentials({
      id: "client",
      name: "Client",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Dynamic import to avoid Edge Runtime issues
          const { prisma } = await import("@/lib/prisma")
          
          const client = await prisma.client.findUnique({
            where: { email: String(credentials.email).toLowerCase().trim() }
          })

          if (!client) {
            return null
          }

          if (client.password !== String(credentials.password)) {
            return null
          }

          const userData = {
            id: client.id,
            email: client.email,
            name: `${client.firstName} ${client.lastName}`,
            role: "CLIENT",
            userType: "client" as const
          }
          
          console.log("✅ Client authorized:", userData)
          return userData
        } catch (error) {
          console.error("❌ Client auth error:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/error"
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.userType = user.userType
        
        // Debug logging
        console.log("🔑 JWT callback - storing:", {
          userId: user.id,
          role: user.role,
          userType: user.userType
        })
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.userType = token.userType as string
        
        // Debug logging
        console.log("👤 Session callback - returning:", {
          userId: session.user.id,
          role: session.user.role,
          userType: session.user.userType
        })
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 24 hours
  }
}

export default config
