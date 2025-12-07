import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role?: string
      userType: 'admin' | 'client'
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role?: string
    userType: 'admin' | 'client'
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    userId?: string
    role?: string
    userType: 'admin' | 'client'
  }
}
