"use server"

import { signIn, signOut } from "@/auth"
import { redirect } from "next/navigation"

/**
 * Server Actions for Authentication
 * Clean, no callback hell, production-ready
 */

export async function loginAdmin(email: string, password: string) {
  try {
    await signIn("admin", {
      email: email.toLowerCase().trim(),
      password,
      redirect: true,
      redirectTo: "/admin"
    })
    
    return { success: true }
  } catch (error: unknown) {
    // Handle redirect errors
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    const err = error as Error
    if (err.message?.includes('CredentialsSignin')) {
      return { success: false, error: "Email ou mot de passe incorrect" }
    }
    
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function loginClient(email: string, password: string) {
  try {
    await signIn("client", {
      email: email.toLowerCase().trim(),
      password,
      redirect: true,
      redirectTo: "/me"
    })
    
    return { success: true }
  } catch (error: unknown) {
    // Handle redirect errors
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    
    const err = error as Error
    
    if (err.message?.includes('CredentialsSignin')) {
      return { success: false, error: "Email ou mot de passe incorrect" }
    }
    
    return { success: false, error: "Une erreur est survenue" }
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" })
}
