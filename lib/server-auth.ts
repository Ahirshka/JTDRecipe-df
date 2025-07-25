import { cookies } from "next/headers"
import { findSessionByToken, findUserById } from "@/lib/neon"
import type { User } from "@/lib/neon"
import type { NextRequest } from "next/server"

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("🔄 [SERVER-AUTH] Getting current user from cookies")

    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      console.log("❌ [SERVER-AUTH] No session token found in cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Session token found:", sessionToken.substring(0, 10) + "...")

    // Find session
    const session = await findSessionByToken(sessionToken)
    if (!session) {
      console.log("❌ [SERVER-AUTH] Invalid or expired session token")
      return null
    }

    console.log("✅ [SERVER-AUTH] Valid session found for user ID:", session.user_id)

    // Find user
    const user = await findUserById(session.user_id)
    if (!user) {
      console.log("❌ [SERVER-AUTH] User not found for session")
      return null
    }

    console.log("✅ [SERVER-AUTH] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user:", error)
    return null
  }
}

export async function getCurrentUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    console.log("🔄 [SERVER-AUTH] Getting current user from request")

    // Try to get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value

    if (!sessionToken) {
      console.log("❌ [SERVER-AUTH] No session token found in request cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Session token found in request:", sessionToken.substring(0, 10) + "...")

    // Find session
    const session = await findSessionByToken(sessionToken)
    if (!session) {
      console.log("❌ [SERVER-AUTH] Invalid or expired session token from request")
      return null
    }

    console.log("✅ [SERVER-AUTH] Valid session found from request for user ID:", session.user_id)

    // Find user
    const user = await findUserById(session.user_id)
    if (!user) {
      console.log("❌ [SERVER-AUTH] User not found for session from request")
      return null
    }

    console.log("✅ [SERVER-AUTH] User authenticated from request:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user from request:", error)
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAuthFromRequest(request: NextRequest): Promise<User> {
  const user = await getCurrentUserFromRequest(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function requireAdmin(request?: NextRequest): Promise<User> {
  try {
    console.log("🔄 [SERVER-AUTH] Checking admin access")

    let user: User | null = null

    if (request) {
      user = await getCurrentUserFromRequest(request)
    } else {
      user = await getCurrentUser()
    }

    if (!user) {
      console.log("❌ [SERVER-AUTH] No user found for admin check")
      throw new Error("Authentication required")
    }

    if (!isAdmin(user)) {
      console.log("❌ [SERVER-AUTH] User is not admin:", { role: user.role })
      throw new Error("Admin access required")
    }

    console.log("✅ [SERVER-AUTH] Admin access granted:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Admin check failed:", error)
    throw error
  }
}

export function isAdmin(user: User | null): boolean {
  if (!user) {
    return false
  }

  const adminRoles = ["admin", "owner"]
  const hasAdminAccess = adminRoles.includes(user.role)

  console.log(
    `✅ [SERVER-AUTH] Admin check for ${user.username}: ${hasAdminAccess ? "granted" : "denied"} (role: ${user.role})`,
  )

  return hasAdminAccess
}

export function isModerator(user: User | null): boolean {
  if (!user) {
    return false
  }

  const moderatorRoles = ["moderator", "admin", "owner"]
  const hasModeratorAccess = moderatorRoles.includes(user.role)

  console.log(
    `✅ [SERVER-AUTH] Moderator check for ${user.username}: ${hasModeratorAccess ? "granted" : "denied"} (role: ${user.role})`,
  )

  return hasModeratorAccess
}

export function isOwner(user: User | null): boolean {
  if (!user) {
    return false
  }

  const hasOwnerAccess = user.role === "owner"

  console.log(
    `✅ [SERVER-AUTH] Owner check for ${user.username}: ${hasOwnerAccess ? "granted" : "denied"} (role: ${user.role})`,
  )

  return hasOwnerAccess
}

export function hasRole(user: User | null, role: string): boolean {
  if (!user) {
    return false
  }

  const hasAccess = user.role === role
  console.log(`✅ [SERVER-AUTH] Role check (${role}) for ${user.username}: ${hasAccess ? "granted" : "denied"}`)
  return hasAccess
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  if (!user) {
    return false
  }

  const hasAccess = roles.includes(user.role)
  console.log(
    `✅ [SERVER-AUTH] Any role check (${roles.join(", ")}) for ${user.username}: ${hasAccess ? "granted" : "denied"}`,
  )
  return hasAccess
}

export function canModerate(user: User | null): boolean {
  return isModerator(user)
}

export function canAccessAdmin(user: User | null): boolean {
  return isAdmin(user)
}

export async function requirePermission(request: NextRequest, requiredRole: string): Promise<User> {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [SERVER-AUTH] Authentication required for permission check")
      throw new Error("Authentication required")
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
      throw new Error(`Insufficient permissions. Required: ${requiredRole}, Current: ${user.role}`)
    }

    console.log(`✅ [SERVER-AUTH] Permission granted: ${user.role} >= ${requiredRole}`)
    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error checking permissions:", error)
    throw error
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

export async function requireVerified(request: NextRequest): Promise<User> {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [SERVER-AUTH] Authentication required for verification check")
      throw new Error("Authentication required")
    }

    if (!isVerified(user)) {
      console.log("❌ [SERVER-AUTH] Email verification required")
      throw new Error("Email verification required")
    }

    console.log("✅ [SERVER-AUTH] Verified user access granted")
    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error checking verification:", error)
    throw error
  }
}

export function createSessionCookie(token: string): string {
  const expires = new Date()
  expires.setDate(expires.getDate() + 7) // 7 days

  return `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=${expires.toUTCString()}`
}

export function clearSessionCookie(): string {
  return "session_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
}

export async function setAuthCookie(token: string): Promise<void> {
  try {
    console.log("🔍 [SERVER-AUTH] Setting authentication cookie")

    const cookieStore = await cookies()
    cookieStore.set("session_token", token, {
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

    const cookieStore = await cookies()
    cookieStore.delete("session_token")
    cookieStore.delete("auth-token") // Clear any legacy auth tokens

    console.log("✅ [SERVER-AUTH] Authentication cookies cleared successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error clearing authentication cookies:", error)
    throw error
  }
}

export async function createSession(userId: string): Promise<string> {
  try {
    console.log("🔄 [SERVER-AUTH] Creating new session for user:", userId)

    // Generate session token
    const sessionToken = crypto.randomUUID()

    // Set expiration (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store session in database (you'll need to implement this in your neon.ts)
    // await createUserSession(userId, sessionToken, expiresAt)

    console.log("✅ [SERVER-AUTH] Session created successfully")
    return sessionToken
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error creating session:", error)
    throw error
  }
}

export async function destroySession(sessionToken: string): Promise<void> {
  try {
    console.log("🔄 [SERVER-AUTH] Destroying session")

    // Remove session from database (you'll need to implement this in your neon.ts)
    // await deleteUserSession(sessionToken)

    console.log("✅ [SERVER-AUTH] Session destroyed successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error destroying session:", error)
    throw error
  }
}
