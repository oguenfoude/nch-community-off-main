"use server"

import { signIn, signOut } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Server Actions for Authentication
 * Clean, no callback hell, production-ready
 */

export async function loginAdmin(email: string, password: string) {
  try {
    const result = await signIn("admin", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false
    })
    
    if (result?.error) {
      return { 
        success: false, 
        error: result.error === 'CredentialsSignin' 
          ? "Email ou mot de passe incorrect" 
          : "Une erreur est survenue" 
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error("❌ Admin login error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function loginClient(email: string, password: string) {
  try {
    const result = await signIn("client", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false
    })
    
    if (result?.error) {
      return { 
        success: false, 
        error: result.error === 'CredentialsSignin' 
          ? "Email ou mot de passe incorrect" 
          : "Une erreur est survenue" 
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error("❌ Client login error:", error)
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" })
}
