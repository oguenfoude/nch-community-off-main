import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Lightweight Middleware - Edge Runtime Compatible
 * Auth protection moved to page level to avoid Edge Runtime issues
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CORS for API routes
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"]
}
