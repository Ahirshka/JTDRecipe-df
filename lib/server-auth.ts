import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import { verifyToken } from "./auth"
import { findUserById } from "./neon"

export interface AuthenticatedUser {
  id: number
  username: string
  email: string
  role: string
  is_verified: boolean
}

// Get current user from request
export async function getCurrentUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get("authorization")
    const cookieToken = request.cookies.get("auth-token")?.value

    let token: string | null = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7)
    } else if (cookieToken) {
      token = cookieToken
    }

    if (!token) {
      console.log("🔍 No authentication token found")
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("❌ Invalid or expired token")
      return null
    }

    const user = await findUserById(Number.parseInt(decoded.id))
    if (!user) {
      console.log("❌ User not found in database")
      return null
    }

    if (user.status !== "active") {
      console.log("❌ User account is not active")
      return null
    }

    console.log("✅ User authenticated successfully")
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    }
  } catch (error) {
    console.error("❌ Error getting current user from request:", error)
    return null
  }
}

// Get current user from cookies
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("🔍 No authentication token found in cookies")
      return null
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("❌ Invalid or expired token")
      return null
    }

    const user = await findUserById(Number.parseInt(decoded.id))
    if (!user) {
      console.log("❌ User not found in database")
      return null
    }

    if (user.status !== "active") {
      console.log("❌ User account is not active")
      return null
    }

    console.log("✅ User authenticated successfully")
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
    }
  } catch (error) {
    console.error("❌ Error getting current user:", error)
    return null
  }
}

// Set authentication cookie
export async function setAuthCookie(token: string): Promise<void> {
  try {
    const cookieStore = cookies()

    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ Authentication cookie set successfully")
  } catch (error) {
    console.error("❌ Error setting authentication cookie:", error)
    throw error
  }
}

// Clear authentication cookie
export async function clearAuthCookie(): Promise<void> {
  try {
    const cookieStore = cookies()

    cookieStore.delete("auth-token")
    cookieStore.delete("session-token") // Clear any legacy session tokens

    console.log("✅ Authentication cookies cleared successfully")
  } catch (error) {
    console.error("❌ Error clearing authentication cookies:", error)
    throw error
  }
}

// Check if user is admin
export function isAdmin(user: AuthenticatedUser | null): boolean {
  if (!user) {
    return false
  }

  const adminRoles = ["admin", "owner"]
  const hasAdminRole = adminRoles.includes(user.role)

  console.log(`✅ Admin check: ${hasAdminRole ? "granted" : "denied"} (role: ${user.role})`)
  return hasAdminRole
}

// Require admin role (throws error if not admin)
export async function requireAdmin(): Promise<AuthenticatedUser> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ Authentication required")
      throw new Error("Authentication required")
    }

    if (!isAdmin(user)) {
      console.log("❌ Admin privileges required")
      throw new Error("Admin privileges required")
    }

    console.log("✅ Admin access granted")
    return user
  } catch (error) {
    console.error("❌ Admin requirement check failed:", error)
    throw error
  }
}

// Check if user has specific permission
export function hasPermission(user: AuthenticatedUser | null, requiredRole: string): boolean {
  if (!user) {
    return false
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

  const hasAccess = userLevel >= requiredLevel
  console.log(`✅ Permission check: ${hasAccess ? "granted" : "denied"} (${user.role} -> ${requiredRole})`)

  return hasAccess
}

// Check if user can moderate content
export function canModerate(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, "moderator")
}

// Check if user can access admin features
export function canAccessAdmin(user: AuthenticatedUser | null): boolean {
  return hasPermission(user, "admin")
}

// Require specific permission level
export async function requirePermission(requiredRole: string): Promise<AuthenticatedUser> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ Authentication required")
      throw new Error("Authentication required")
    }

    if (!hasPermission(user, requiredRole)) {
      console.log(`❌ ${requiredRole} privileges required`)
      throw new Error(`${requiredRole} privileges required`)
    }

    console.log(`✅ ${requiredRole} access granted`)
    return user
  } catch (error) {
    console.error(`❌ ${requiredRole} requirement check failed:`, error)
    throw error
  }
}

// Get user role level
export function getUserRoleLevel(user: AuthenticatedUser | null): number {
  if (!user) {
    return 0
  }

  const roleHierarchy: Record<string, number> = {
    user: 1,
    verified: 2,
    moderator: 3,
    admin: 4,
    owner: 5,
  }

  return roleHierarchy[user.role] || 0
}

// Check if user account is verified
export function isVerified(user: AuthenticatedUser | null): boolean {
  return user?.is_verified === true
}

// Require verified account
export async function requireVerified(): Promise<AuthenticatedUser> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ Authentication required")
      throw new Error("Authentication required")
    }

    if (!isVerified(user)) {
      console.log("❌ Email verification required")
      throw new Error("Email verification required")
    }

    console.log("✅ Verified user access granted")
    return user
  } catch (error) {
    console.error("❌ Verification requirement check failed:", error)
    throw error
  }
}
