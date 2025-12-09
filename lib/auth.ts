import { auth } from "@/auth"

/**
 * Auth helpers for API routes
 * Clean, modern, production-ready for Auth.js v5
 */

export async function getAuthenticatedUser() {
  const session = await auth()
  
  if (!session || !session.user) {
    return null
  }
  
  return session.user
}

export async function requireAuth() {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    throw new Error("Non autorisé")
  }
  
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  
  const userType = (user as any).userType
  
  // Debug logging for production
  console.log("🔍 requireAdmin check:", {
    userId: user.id,
    email: user.email,
    userType,
    role: (user as any).role,
    fullUser: JSON.stringify(user)
  })
  
  if (userType !== "admin") {
    throw new Error("Accès administrateur requis")
  }
  
  return user
}

export async function requireClient() {
  const user = await requireAuth()
  
  const userType = (user as any).userType
  if (userType !== "client") {
    throw new Error("Accès client requis")
  }
  
  return user
}
