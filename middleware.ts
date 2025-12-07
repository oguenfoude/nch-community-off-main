import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Handle CORS for API routes
  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control",
          "Access-Control-Max-Age": "86400",
        },
      })
    }
  }
  
  // Get the token
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Admin routes (except login page)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!token) {
      // Redirect to admin login
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
    
    // Check if user is admin
    if (token.userType !== "admin" && token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // Client routes (/me)
  if (pathname.startsWith("/me")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    
    // Check if user is client
    if (token.userType !== "client") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Already logged in admin trying to access admin login
  if (pathname === "/admin/login" && token?.userType === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  // Already logged in client trying to access client login  
  if (pathname === "/login" && token?.userType === "client") {
    return NextResponse.redirect(new URL("/me", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/me/:path*", "/login", "/api/:path*"]
}
