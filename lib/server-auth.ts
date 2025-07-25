import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { findUserById } from "@/lib/neon"

export async function getCurrentUser() {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user")

    // Get cookies from the request
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")?.value || cookieStore.get("auth_token")?.value

    if (!authToken) {
      console.log("❌ [SERVER-AUTH] No auth token found in cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Found auth token")

    // Verify the token
    const decoded = verifyToken(authToken)
    if (!decoded) {
      console.log("❌ [SERVER-AUTH] Token verification failed")
      return null
    }

    console.log("✅ [SERVER-AUTH] Token verified for user:", decoded.id)

    // Get user from database
    const user = await findUserById(decoded.id)
    if (!user) {
      console.log("❌ [SERVER-AUTH] User not found in database:", decoded.id)
      return null
    }

    console.log("✅ [SERVER-AUTH] User found:", user.username)
    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user:", error)
    return null
  }
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user from request")

    // Get auth token from request cookies
    const authToken = request.cookies.get("auth-token")?.value || request.cookies.get("auth_token")?.value

    if (!authToken) {
      console.log("❌ [SERVER-AUTH] No auth token found in request cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Found auth token in request")

    // Verify the token
    const decoded = verifyToken(authToken)
    if (!decoded) {
      console.log("❌ [SERVER-AUTH] Token verification failed")
      return null
    }

    console.log("✅ [SERVER-AUTH] Token verified for user:", decoded.id)

    // Get user from database
    const user = await findUserById(decoded.id)
    if (!user) {
      console.log("❌ [SERVER-AUTH] User not found in database:", decoded.id)
      return null
    }

    console.log("✅ [SERVER-AUTH] User found:", user.username)
    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user from request:", error)
    return null
  }
}

export function setAuthCookie(token: string): NextResponse {
  const response = NextResponse.json({ success: true })

  // Set multiple cookie variations for compatibility
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return response
}

export function clearAuthCookie(): NextResponse {
  const response = NextResponse.json({ success: true })

  // Clear both cookie variations
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })

  return response
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
  return user
}

export async function requireRole(request: NextRequest, allowedRoles: string[]) {
  const user = await getCurrentUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  return user
}
