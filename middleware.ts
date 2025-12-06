import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is accessing admin routes
        if (req.nextUrl.pathname.startsWith("/admin") && req.nextUrl.pathname !== "/admin/login") {
          return !!token
        }
        if (req.nextUrl.pathname.startsWith("/me")) {
          return !!token
        }
        return true
      },
    },
  },
)

export const config = {
  matcher: ["/admin/:path*"],
}
