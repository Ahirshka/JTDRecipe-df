import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { findUserById } from "./neon"
import { verifyToken } from "./auth"
import type { User } from "./neon"

export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user from request")

    // Try to get token from Authorization header first
    const authHeader = request.headers.get("authorization")
    let token: string | null = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
      console.log("✅ [SERVER-AUTH] Found token in Authorization header")
    } else {
      // Try to get token from cookies
      token = request.cookies.get("auth-token")?.value || null
      if (token) {
        console.log("✅ [SERVER-AUTH] Found token in cookies")
      }
    }

    if (!token) {
      console.log("❌ [SERVER-AUTH] No authentication token found")
      return null
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      console.log("❌ [SERVER-AUTH] Token verification failed")
      return null
    }

    console.log("✅ [SERVER-AUTH] Token verified for user:", payload.userId)

    // Get user from database
    const user = await findUserById(payload.userId)
    if (!user) {
      console.log("❌ [SERVER-AUTH] User not found in database:", payload.userId)
      return null
    }

    // Check if user is active
    if (user.status !== "active") {
      console.log("❌ [SERVER-AUTH] User account is not active:", user.status)
      return null
    }

    console.log("✅ [SERVER-AUTH] User authenticated successfully:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user from request:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user from cookies")

    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("❌ [SERVER-AUTH] No authentication token found in cookies")
      return null
    }

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload || !payload.userId) {
      console.log("❌ [SERVER-AUTH] Token verification failed")
      return null
    }

    console.log("✅ [SERVER-AUTH] Token verified for user:", payload.userId)

    // Get user from database
    const user = await findUserById(payload.userId)
    if (!user) {
      console.log("❌ [SERVER-AUTH] User not found in database:", payload.userId)
      return null
    }

    // Check if user is active
    if (user.status !== "active") {
      console.log("❌ [SERVER-AUTH] User account is not active:", user.status)
      return null
    }

    console.log("✅ [SERVER-AUTH] User authenticated successfully:", {
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

export async function setAuthCookie(token: string): Promise<void> {
  try {
    console.log("🔍 [SERVER-AUTH] Setting authentication cookie")

    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("✅ [SERVER-AUTH] Authentication cookie set successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error setting authentication cookie:", error)
    throw error
  }
}

export async function clearAuthCookie(): Promise<void> {
  try {
    console.log("🔍 [SERVER-AUTH] Clearing authentication cookie")

    const cookieStore = cookies()
    cookieStore.delete("auth-token")
    cookieStore.delete("session-token") // Clear any legacy session tokens

    console.log("✅ [SERVER-AUTH] Authentication cookies cleared successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error clearing authentication cookies:", error)
    throw error
  }
}

export async function requireAdmin(request: NextRequest): Promise<User | null> {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      console.log("❌ [SERVER-AUTH] Admin access denied")
      return null
    }
    console.log("✅ [SERVER-AUTH] Admin access granted")
    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error checking admin access:", error)
    return null
  }
}

export async function isAdmin(user: User | null): Promise<boolean> {
  const adminAccess = user?.role === "admin" || user?.role === "owner"
  console.log(`✅ [SERVER-AUTH] Admin check: ${adminAccess ? "granted" : "denied"}`)
  return adminAccess
}

export async function requireAuth(request: NextRequest): Promise<User | null> {
  return getCurrentUserFromRequest(request)
}

export function hasRole(user: User | null, role: string): boolean {
  const hasAccess = user?.role === role
  console.log(`✅ [SERVER-AUTH] Role check (${role}): ${hasAccess ? "granted" : "denied"}`)
  return hasAccess
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  const hasAccess = user ? roles.includes(user.role) : false
  console.log(`✅ [SERVER-AUTH] Any role check (${roles.join(", ")}): ${hasAccess ? "granted" : "denied"}`)
  return hasAccess
}

export function canModerate(user: User | null): boolean {
  const moderatorRoles = ["moderator", "admin", "owner"]
  return hasAnyRole(user, moderatorRoles)
}

export function canAccessAdmin(user: User | null): boolean {
  const adminRoles = ["admin", "owner"]
  return hasAnyRole(user, adminRoles)
}

export async function requirePermission(request: NextRequest, requiredRole: string): Promise<User | null> {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [SERVER-AUTH] Authentication required")
      return null
    }

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
      console.log(`❌ [SERVER-AUTH] Insufficient permissions: ${user.role} < ${requiredRole}`)
      return null
    }

    console.log(`✅ [SERVER-AUTH] Permission granted: ${user.role} >= ${requiredRole}`)
    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error checking permissions:", error)
    return null
  }
}

export function getUserRoleLevel(user: User | null): number {
  if (!user) return 0

  const roleHierarchy: Record<string, number> = {
    user: 1,
    verified: 2,
    moderator: 3,
    admin: 4,
    owner: 5,
  }

  return roleHierarchy[user.role] || 0
}

export function isVerified(user: User | null): boolean {
  return user?.is_verified === true
}

export async function requireVerified(request: NextRequest): Promise<User | null> {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [SERVER-AUTH] Authentication required")
      return null
    }

    if (!isVerified(user)) {
      console.log("❌ [SERVER-AUTH] Email verification required")
      return null
    }

    console.log("✅ [SERVER-AUTH] Verified user access granted")
    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error checking verification:", error)
    return null
  }
}
