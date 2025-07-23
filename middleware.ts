import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated
        if (!token) return false
        
        // Check if user is active
        if (token.status !== 'ACTIVE') return false
        
        // Add role-based access control if needed
        const { pathname } = req.nextUrl
        
        // Admin-only routes
        if (pathname.startsWith('/admin') && token.role !== 'ADMINISTRATOR') {
          return false
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/purchase-requests/:path*',
    '/reception/:path*',
    '/distribution/:path*',
    '/correspondence/:path*',
    '/archive-inventory/:path*',
    '/users/:path*',
    '/admin/:path*'
  ]
}
