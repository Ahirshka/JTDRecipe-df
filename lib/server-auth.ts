import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { findUserById } from "@/lib/neon"

// Get current user from request
export async function getCurrentUser() {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user")

    // Get cookies
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")?.value || cookieStore.get("auth_token")?.value

    if (!authToken) {
      console.log("❌ [SERVER-AUTH] No auth token found in cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Found auth token")

    // Verify token
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

// Get current user from request object (for API routes)
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

    // Verify token
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

// Set auth cookie - REQUIRED EXPORT
export async function setAuthCookie(token: string) {
  try {
    console.log("🔍 [SERVER-AUTH] Setting auth cookie")
    const cookieStore = await cookies()

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    cookieStore.set("auth-token", token, cookieOptions)
    cookieStore.set("auth_token", token, cookieOptions) // Alternative name for compatibility

    console.log("✅ [SERVER-AUTH] Auth cookie set successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error setting auth cookie:", error)
    throw error
  }
}

// Clear auth cookie - REQUIRED EXPORT
export async function clearAuthCookie() {
  try {
    console.log("🔍 [SERVER-AUTH] Clearing auth cookie")
    const cookieStore = await cookies()

    cookieStore.delete("auth-token")
    cookieStore.delete("auth_token")

    console.log("✅ [SERVER-AUTH] Auth cookie cleared successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error clearing auth cookie:", error)
    throw error
  }
}

// Create auth response with cookie
export function createAuthResponse(data: any, token: string) {
  const response = NextResponse.json(data)

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  }

  response.cookies.set("auth-token", token, cookieOptions)
  response.cookies.set("auth_token", token, cookieOptions)

  return response
}

// Create logout response
export function createLogoutResponse(data: any) {
  const response = NextResponse.json(data)

  response.cookies.delete("auth-token")
  response.cookies.delete("auth_token")

  return response
}
