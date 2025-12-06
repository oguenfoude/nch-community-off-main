import { NextAuthOptions } from "next-auth"
import type { User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"
import { prisma } from "./prisma"
import { adminHelpers } from "./prisma"
import { NextRequest } from "next/server"

// Types étendus pour NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      userType: 'admin' | 'client'
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    userType: 'admin' | 'client'
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    userId: string
    userType: 'admin' | 'client'
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ✅ Provider pour les admins
    CredentialsProvider({
      id: "admin",
      name: "Admin Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "admin@nch-community.com"
        },
        password: {
          label: "Mot de passe",
          type: "password",
          placeholder: "••••••••"
        },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credentials manquants")
          return null
        }

        try {
          // ✅ Rechercher l'admin avec Prisma
          const admin = await prisma.admin.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim(),
            }
          })

          if (!admin || !admin.isActive) {
            console.log("Admin non trouvé ou inactif:", credentials.email)
            return null
          }

          // ✅ Vérifier le mot de passe avec les helpers
          const isPasswordValid = await adminHelpers.comparePassword(
            credentials.password,
            admin.password
          )

          if (!isPasswordValid) {
            console.log("Mot de passe invalide pour:", credentials.email)
            return null
          }

          // ✅ Mettre à jour la dernière connexion avec Prisma
          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() }
          })

          console.log("Connexion admin réussie pour:", admin.email)

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            userType: 'admin'
          }
        } catch (error) {
          console.error("Erreur d'authentification admin:", error)
          return null
        }
      },
    }),

    // ✅ Provider pour les clients
    CredentialsProvider({
      id: "client",
      name: "Client Login",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "client@exemple.com"
        },
        password: {
          label: "Mot de passe",
          type: "password",
          placeholder: "••••••••"
        },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credentials client manquants")
          return null
        }

        try {
          // ✅ Rechercher le client avec Prisma
          const client = await prisma.client.findUnique({
            where: {
              email: credentials.email.toLowerCase().trim(),
            }
          })

          if (!client) {
            console.log("Client non trouvé:", credentials.email)
            return null
          }

          // ✅ Vérification simple du mot de passe
          if (!client.password || client.password !== credentials.password) {
            console.log("Mot de passe client invalide pour:", credentials.email)
            return null
          }

          // ✅ Mettre à jour la dernière connexion


          console.log("Connexion client réussie pour:", client.email)

          return {
            id: client.id,
            email: client.email,
            name: `${client.firstName} ${client.lastName}`,
            role: 'CLIENT',
            userType: 'client'
          }
        } catch (error) {
          console.error("Erreur d'authentification client:", error)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 heures
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
      if (user) {
        token.role = user.role
        token.userId = user.id
        token.userType = user.userType
      }
      return token
    },
    async session({ session, token }: { session: import("next-auth").Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.userId
        session.user.role = token.role
        session.user.userType = token.userType
      }
      return session
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // ✅ Gestion spécifique des redirections
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url

      // Redirection par défaut
      return baseUrl
    },
  },
  pages: {
    // ✅ Ne pas définir signIn pour permettre les pages personnalisées
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

import type { Session } from "next-auth"

export async function getAuthenticatedUser(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null

  if (!session || !session.user) {
    return null
  }
  return session.user
}

export async function requireAuth(req: NextRequest) {
  const user = await getAuthenticatedUser(req)

  if (!user) {
    throw new Error("Non autorisé")
  }

  return user
}

export async function requireAdmin(req: NextRequest) {
  const user = await requireAuth(req)

  // ✅ Vérifier que c'est un admin ET qu'il a le bon rôle
  if (user.userType !== 'admin' || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    throw new Error("Accès administrateur requis")
  }

  return user
}

// ✅ Fonction pour vérifier les clients
export async function requireClient(req: NextRequest) {
  const user = await requireAuth(req)

  if (user.userType !== 'client') {
    throw new Error("Accès client requis")
  }

  return user
}