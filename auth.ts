import NextAuth from "next-auth"
import authConfig from "./auth.config"

/**
 * Auth.js v5 - Clean & Modern
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export const GET = handlers.GET
export const POST = handlers.POST
