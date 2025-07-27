import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "./auth-system"
import type { NextRequest } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export interface ServerUser {
  id: string
  username: string
  email: string
  role: string
  status: string
  is_verified?: boolean
  created_at: string
  last_login_at?: string
}

// Get current user from cookies (server-side)
export async function getCurrentUser(): Promise<ServerUser | null> {
  try {
    console.log("🔄 [SERVER-AUTH] Getting current user from cookies")

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("❌ [SERVER-AUTH] No auth token found in cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Auth token found, verifying...")

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [SERVER-AUTH] Invalid or expired token")
      return null
    }

    console.log("✅ [SERVER-AUTH] Token verified, fetching user:", payload.userId)

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE id = ${payload.userId}
      AND status = 'active'
    `

    if (users.length === 0) {
      console.log("❌ [SERVER-AUTH] User not found or inactive:", payload.userId)
      return null
    }

    const user = users[0] as any
    console.log("✅ [SERVER-AUTH] User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified || false,
      created_at: user.created_at,
      last_login_at: user.updated_at,
    }
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user:", error)
    return null
  }
}

// Get current user from request (required export)
export async function getCurrentUserFromRequest(request: NextRequest): Promise<ServerUser | null> {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user from request...")
    console.log("🔍 [SERVER-AUTH] Request URL:", request.url)

    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.log("❌ [SERVER-AUTH] No auth token found in request cookies")

      // Log all available cookies for debugging
      const allCookies = Array.from(request.cookies.entries()).map(([name, cookie]) => ({
        name,
        hasValue: !!cookie.value,
        valuePreview: cookie.value ? cookie.value.substring(0, 20) + "..." : "empty",
      }))
      console.log("🔍 [SERVER-AUTH] Available request cookies:", allCookies)

      return null
    }

    console.log("✅ [SERVER-AUTH] Auth token found in request, verifying...")

    // Verify JWT token
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [SERVER-AUTH] Invalid or expired token")
      return null
    }

    console.log("✅ [SERVER-AUTH] Token verified, fetching user:", payload.userId)

    // Get user from database with detailed logging
    console.log("🔍 [SERVER-AUTH] Querying database for user...")
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE id = ${payload.userId}
      AND status = 'active'
    `

    console.log("🔍 [SERVER-AUTH] Database query result:", {
      found: users.length,
      userId: payload.userId,
    })

    if (users.length === 0) {
      console.log("❌ [SERVER-AUTH] User not found in database for ID:", payload.userId)

      // Additional debugging: check if user exists with different ID format
      try {
        const allUsers = await sql`SELECT id, username, role FROM users LIMIT 5`
        console.log("🔍 [SERVER-AUTH] Sample users in database:", allUsers)
      } catch (debugError) {
        console.log("❌ [SERVER-AUTH] Could not query sample users:", debugError)
      }

      return null
    }

    const user = users[0] as any
    console.log("✅ [SERVER-AUTH] User found from request:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
    })

    // Additional admin role verification
    const adminRoles = ["admin", "owner", "moderator"]
    const isAdminUser = adminRoles.includes(user.role)
    console.log("🔍 [SERVER-AUTH] Admin role check:", {
      userRole: user.role,
      isAdmin: isAdminUser,
      adminRoles: adminRoles,
    })

    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified || false,
      created_at: user.created_at,
      last_login_at: user.updated_at,
    }
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user from request:", error)
    return null
  }
}

// Require authentication for server-side operations
export async function requireAuth(request?: NextRequest): Promise<ServerUser | null> {
  console.log("🔒 [SERVER-AUTH] Requiring authentication")

  const user = request ? await getCurrentUserFromRequest(request) : await getCurrentUser()

  if (!user) {
    console.log("❌ [SERVER-AUTH] Authentication required but no user found")
    return null
  }

  console.log("✅ [SERVER-AUTH] Authentication verified for:", user.username)
  return user
}

// Require authentication from request (required export)
export async function requireAuthFromRequest(request: NextRequest): Promise<ServerUser> {
  const user = await getCurrentUserFromRequest(request)
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

// Require admin role for server-side operations
export async function requireAdmin(request?: NextRequest): Promise<ServerUser> {
  try {
    console.log("🔄 [SERVER-AUTH] Checking admin access")

    let user: ServerUser | null = null

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
      console.log("❌ [SERVER-AUTH] User is not admin:", {
        username: user.username,
        role: user.role,
        status: user.status,
      })
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

// Require owner role for server-side operations
export async function requireOwner(request?: NextRequest): Promise<ServerUser> {
  console.log("🔒 [SERVER-AUTH] Requiring owner role")

  const user = request ? await getCurrentUserFromRequest(request) : await getCurrentUser()

  if (!user) {
    console.log("❌ [SERVER-AUTH] No authenticated user")
    throw new Error("Authentication required")
  }

  if (user.role !== "owner") {
    console.log("❌ [SERVER-AUTH] User does not have owner role:", user.role)
    throw new Error("Owner access required")
  }

  console.log("✅ [SERVER-AUTH] Owner access verified for:", user.username)
  return user
}

// Check if user is admin
export function isAdmin(user: ServerUser | null): boolean {
  if (!user) {
    console.log("❌ [SERVER-AUTH] Admin check: no user provided")
    return false
  }

  const adminRoles = ["admin", "owner"]
  const hasAdminAccess = adminRoles.includes(user.role)

  console.log("🔍 [SERVER-AUTH] Admin check details:", {
    username: user.username,
    userRole: user.role,
    adminRoles: adminRoles,
    hasAccess: hasAdminAccess,
    userStatus: user.status,
  })

  return hasAdminAccess
}

// Check if user is moderator
export function isModerator(user: ServerUser | null): boolean {
  if (!user) {
    console.log("❌ [SERVER-AUTH] Moderator check: no user provided")
    return false
  }

  const moderatorRoles = ["moderator", "admin", "owner"]
  const hasModeratorAccess = moderatorRoles.includes(user.role)

  console.log("🔍 [SERVER-AUTH] Moderator check details:", {
    username: user.username,
    userRole: user.role,
    moderatorRoles: moderatorRoles,
    hasAccess: hasModeratorAccess,
    userStatus: user.status,
  })

  return hasModeratorAccess
}

// Check if user is owner
export function isOwner(user: ServerUser | null): boolean {
  if (!user) {
    console.log("❌ [SERVER-AUTH] Owner check: no user provided")
    return false
  }

  const hasOwnerAccess = user.role === "owner"

  console.log("🔍 [SERVER-AUTH] Owner check details:", {
    username: user.username,
    userRole: user.role,
    hasAccess: hasOwnerAccess,
    userStatus: user.status,
  })

  return hasOwnerAccess
}

// Check if user has specific role
export function hasRole(user: ServerUser | null, role: string): boolean {
  if (!user) {
    console.log("❌ [SERVER-AUTH] Role check: no user provided")
    return false
  }

  const hasAccess = user.role === role
  console.log(`🔍 [SERVER-AUTH] Role check (${role}) for ${user.username}: ${hasAccess ? "granted" : "denied"}`)
  return hasAccess
}

// Check if user has any of the specified roles
export function hasAnyRole(user: ServerUser | null, roles: string[]): boolean {
  if (!user) {
    console.log("❌ [SERVER-AUTH] Any role check: no user provided")
    return false
  }

  const hasAccess = roles.includes(user.role)
  console.log(
    `🔍 [SERVER-AUTH] Any role check (${roles.join(", ")}) for ${user.username}: ${hasAccess ? "granted" : "denied"}`,
  )
  return hasAccess
}

// Check if user can moderate
export function canModerate(user: ServerUser | null): boolean {
  return isModerator(user)
}

// Check if user can access admin features
export function canAccessAdmin(user: ServerUser | null): boolean {
  return isAdmin(user) || isModerator(user)
}

// Require specific permission level
export async function requirePermission(request: NextRequest, requiredRole: string): Promise<ServerUser> {
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

// Get user role level
export function getUserRoleLevel(user: ServerUser | null): number {
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

// Check if user is verified
export function isVerified(user: ServerUser | null): boolean {
  return user?.is_verified === true
}

// Require verified user
export async function requireVerified(request: NextRequest): Promise<ServerUser> {
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

// Set authentication cookie
export async function setAuthCookie(token: string): Promise<void> {
  try {
    console.log("🔍 [SERVER-AUTH] Setting authentication cookie")

    const cookieStore = await cookies()

    // Set the primary auth token cookie
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

// Clear authentication cookie
export async function clearAuthCookie(): Promise<void> {
  try {
    console.log("🔍 [SERVER-AUTH] Clearing authentication cookie")

    const cookieStore = await cookies()
    const cookieNames = ["auth-token", "auth_token", "auth_session", "session", "session_token"]

    for (const cookieName of cookieNames) {
      cookieStore.delete(cookieName)
    }

    console.log("✅ [SERVER-AUTH] Authentication cookies cleared successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error clearing authentication cookies:", error)
    throw error
  }
}

// Create session for user
export async function createSession(userId: string): Promise<string> {
  try {
    console.log("🔄 [SERVER-AUTH] Creating new session for user:", userId)

    // Generate session token using the auth library
    const { generateToken } = await import("@/lib/auth-system")
    const user = await sql`SELECT * FROM users WHERE id = ${userId}`

    if (user.length === 0) {
      throw new Error("User not found")
    }

    const sessionToken = generateToken({
      userId: user[0].id.toString(),
      email: user[0].email,
      role: user[0].role,
    })

    console.log("✅ [SERVER-AUTH] Session created successfully")
    return sessionToken
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error creating session:", error)
    throw error
  }
}

// Destroy session
export async function destroySession(sessionToken: string): Promise<void> {
  try {
    console.log("🔄 [SERVER-AUTH] Destroying session")
    // For JWT tokens, we just need to clear the cookie
    // The token will expire naturally
    await clearAuthCookie()
    console.log("✅ [SERVER-AUTH] Session destroyed successfully")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error destroying session:", error)
    throw error
  }
}

// Get user by ID (utility function)
export async function getUserById(id: number): Promise<ServerUser | null> {
  console.log("🔍 [SERVER-AUTH] Getting user by ID:", id)

  try {
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE id = ${id}
    `

    if (users.length === 0) {
      console.log("❌ [SERVER-AUTH] User not found by ID:", id)
      return null
    }

    const user = users[0] as any
    console.log("✅ [SERVER-AUTH] User found by ID:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified || false,
      created_at: user.created_at,
      last_login_at: user.updated_at,
    }
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting user by ID:", error)
    return null
  }
}
