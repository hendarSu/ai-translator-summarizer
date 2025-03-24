import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define paths that are always accessible
  const publicPaths = ["/login", "/api/auth"]
  const isPublicPath = publicPaths.some((pp) => path.startsWith(pp))

  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect logic
  if (!token && !isPublicPath) {
    // Redirect to login if trying to access a protected route without being logged in
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && path === "/login") {
    // Redirect to home if already logged in and trying to access login page
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configure which routes use this middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

