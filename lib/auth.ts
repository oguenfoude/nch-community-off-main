import { auth } from "@/auth"

/**
 * Auth helpers for API routes
 * Clean, modern, production-ready for Auth.js v5
 */

export async function getAuthenticatedUser() {
  let session = await auth()
  
  // Retry once if session is null (timing issue with cookie)
  if (!session || !session.user) {
    await new Promise(resolve => setTimeout(resolve, 50))
    session = await auth()
  }
  
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
  
  if (userType !== "admin") {
    console.error("❌ Access denied - not admin:", { email: user.email, userType })
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
