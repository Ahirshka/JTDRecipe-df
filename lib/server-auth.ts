import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { findUserById } from "@/lib/neon"
import type { User } from "@/lib/neon"

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()

    // Try multiple cookie names for compatibility
    const authToken =
      cookieStore.get("auth-token")?.value ||
      cookieStore.get("auth_token")?.value ||
      cookieStore.get("authToken")?.value

    if (!authToken) {
      console.log("🔍 [SERVER-AUTH] No auth token found in cookies")
      return null
    }

    console.log("🔍 [SERVER-AUTH] Found auth token, verifying...")

    // Verify the JWT token
    const decoded = verifyToken(authToken)
    if (!decoded) {
      console.log("❌ [SERVER-AUTH] Token verification failed")
      return null
    }

    console.log("✅ [SERVER-AUTH] Token verified for user:", decoded.id)

    // Get fresh user data from database
    const user = await findUserById(decoded.id)
    if (!user) {
      console.log("❌ [SERVER-AUTH] User not found in database:", decoded.id)
      return null
    }

    // Check if user account is active
    if (user.status !== "active") {
      console.log("❌ [SERVER-AUTH] User account not active:", user.status)
      return null
    }

    console.log("✅ [SERVER-AUTH] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user:", error)
    return null
  }
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
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

export async function setAuthCookie(token: string): Promise<void> {
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

export async function clearAuthCookie(): Promise<void> {
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

export function createAuthResponse(data: any, token: string): NextResponse {
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

export function createLogoutResponse(data: any): NextResponse {
  const response = NextResponse.json(data)

  response.cookies.delete("auth-token")
  response.cookies.delete("auth_token")

  return response
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireRole(requiredRole: string): Promise<User> {
  const user = await requireAuth()

  const roleHierarchy: Record<string, number> = {
    user: 1,
    verified: 2,
    moderator: 3,
    admin: 4,
    owner: 5,
  }

  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  if (userLevel < requiredLevel) {
    throw new Error(`Role '${requiredRole}' required`)
  }

  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Authentication required")
  }

  if (!isAdmin(user)) {
    throw new Error("Admin access required")
  }

  return user
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
}

export async function hasRole(role: string): Promise<boolean> {
  try {
    await requireRole(role)
    return true
  } catch {
    return false
  }
}

export function isAdmin(user: User | null): boolean {
  if (!user) return false
  return ["admin", "owner"].includes(user.role)
}

export function isModerator(user: User | null): boolean {
  if (!user) return false
  return ["moderator", "admin", "owner"].includes(user.role)
}

export function isOwner(user: User | null): boolean {
  if (!user) return false
  return user.role === "owner"
}
