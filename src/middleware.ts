import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    if (process.env.DEV_MODE === "true") {
      console.log("Dev mode enabled")
      return NextResponse.next()
    }
    
    // Protect Admin routes
    if (path.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Protect Business routes
    if (path.startsWith("/business") && token?.role !== "business" && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Protect Lecturer routes
    if (path.startsWith("/lecturer") && token?.role !== "lecturer" && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    
    // Default dashboard redirection based on role if needed (optional logic)
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Bypass auth in dev mode
        if (process.env.DEV_MODE === "true") return true;
        return !!token;
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/business/:path*", "/lecturer/:path*"],
}
