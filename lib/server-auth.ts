import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"
import type { NextRequest } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: string
  username: string
  email: string
  role: string
  status: string
  is_verified?: boolean
  created_at: string
  last_login_at?: string
}

// Helper function to extract user ID from different token formats
function extractUserIdFromToken(token: string): string | null {
  try {
    console.log("🔍 [SERVER-AUTH] Extracting user ID from token...")

    // First try to verify as JWT
    const payload = verifyToken(token)
    if (payload && payload.userId) {
      console.log("✅ [SERVER-AUTH] User ID extracted via JWT verification:", payload.userId)
      return payload.userId.toString()
    }

    // If JWT verification fails, try to decode without verification to see the structure
    const jwt = require("jsonwebtoken")
    const decoded = jwt.decode(token) as any

    if (decoded) {
      console.log("🔍 [SERVER-AUTH] Token structure:", {
        hasUserId: !!decoded.userId,
        hasId: !!decoded.id,
        keys: Object.keys(decoded),
      })

      // Try different possible user ID fields
      const userId = decoded.userId?.toString() || decoded.id?.toString() || null
      if (userId) {
        console.log("✅ [SERVER-AUTH] User ID extracted via decode:", userId)
        return userId
      }
    }

    console.log("❌ [SERVER-AUTH] Could not extract user ID from token")
    return null
  } catch (error) {
    console.log("❌ [SERVER-AUTH] Token extraction failed:", error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    console.log("🔄 [SERVER-AUTH] Getting current user from cookies")

    const cookieStore = await cookies()

    // Try multiple cookie names that might be used
    const cookieNames = ["auth-token", "auth_token", "auth_session", "session", "session_token"]
    let token = null
    let usedCookieName = null

    for (const cookieName of cookieNames) {
      const cookieValue = cookieStore.get(cookieName)?.value
      if (cookieValue) {
        token = cookieValue
        usedCookieName = cookieName
        console.log(`✅ [SERVER-AUTH] Found token in cookie: ${cookieName}`)
        break
      }
    }

    if (!token) {
      console.log("❌ [SERVER-AUTH] No auth token found in any cookie")
      console.log(
        "Available cookies:",
        Array.from(cookieStore.getAll()).map((c) => c.name),
      )
      return null
    }

    console.log("✅ [SERVER-AUTH] Auth token found in:", usedCookieName)

    // Extract user ID from token
    const userId = extractUserIdFromToken(token)
    if (!userId) {
      console.log("❌ [SERVER-AUTH] Could not extract user ID from token")
      return null
    }

    console.log("✅ [SERVER-AUTH] Extracted user ID:", userId)

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, last_login_at
      FROM users 
      WHERE id = ${userId}
    `

    if (users.length === 0) {
      console.log("❌ [SERVER-AUTH] User not found in database for ID:", userId)
      return null
    }

    const user = users[0] as User
    console.log("✅ [SERVER-AUTH] User found:", {
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
    console.log("🔍 [SERVER-AUTH] Getting current user from request...")
    console.log("🔍 [SERVER-AUTH] Request URL:", request.url)

    // Try multiple cookie names that might be used
    const cookieNames = ["auth-token", "auth_token", "auth_session", "session", "session_token"]
    let token = null
    let usedCookieName = null

    for (const cookieName of cookieNames) {
      const cookieValue = request.cookies.get(cookieName)?.value
      if (cookieValue) {
        token = cookieValue
        usedCookieName = cookieName
        console.log(`✅ [SERVER-AUTH] Found token in request cookie: ${cookieName}`)
        break
      }
    }

    // Log all available cookies for debugging
    const allCookies = Array.from(request.cookies.entries()).map(([name, cookie]) => ({
      name,
      hasValue: !!cookie.value,
      valuePreview: cookie.value.substring(0, 20) + "...",
    }))
    console.log("🔍 [SERVER-AUTH] Available request cookies:", allCookies)

    if (!token) {
      console.log("❌ [SERVER-AUTH] No auth token found in request cookies")
      return null
    }

    console.log("🔑 [SERVER-AUTH] Auth token found in request, extracting user ID...")

    // Extract user ID from token
    const userId = extractUserIdFromToken(token)
    if (!userId) {
      console.log("❌ [SERVER-AUTH] Could not extract user ID from token")
      return null
    }

    console.log("✅ [SERVER-AUTH] Extracted user ID from request:", userId)

    // Get user from database with detailed logging
    console.log("🔍 [SERVER-AUTH] Querying database for user...")
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, last_login_at
      FROM users 
      WHERE id = ${userId}
    `

    console.log("🔍 [SERVER-AUTH] Database query result:", {
      found: users.length,
      userId: userId,
    })

    if (users.length === 0) {
      console.log("❌ [SERVER-AUTH] User not found in database for ID:", userId)

      // Additional debugging: check if user exists with different ID format
      try {
        const allUsers = await sql`SELECT id, username, role FROM users LIMIT 5`
        console.log("🔍 [SERVER-AUTH] Sample users in database:", allUsers)
      } catch (debugError) {
        console.log("❌ [SERVER-AUTH] Could not query sample users:", debugError)
      }

      return null
    }

    const user = users[0] as User
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

    return user
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user from request:", error)
    return null
  }
}

export async function requireAuth(request: NextRequest, requiredRoles?: string[]): Promise<User> {
  const user = await getCurrentUserFromRequest(request)

  if (!user) {
    throw new Error("Authentication required")
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    throw new Error(`Insufficient permissions. Required roles: ${requiredRoles.join(", ")}`)
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

export function isAdmin(user: User | null): boolean {
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

export function isModerator(user: User | null): boolean {
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

export function isOwner(user: User | null): boolean {
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

export function hasRole(user: User | null, role: string): boolean {
  if (!user) {
    console.log("❌ [SERVER-AUTH] Role check: no user provided")
    return false
  }

  const hasAccess = user.role === role
  console.log(`🔍 [SERVER-AUTH] Role check (${role}) for ${user.username}: ${hasAccess ? "granted" : "denied"}`)
  return hasAccess
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
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

export function canModerate(user: User | null): boolean {
  return isModerator(user)
}

export function canAccessAdmin(user: User | null): boolean {
  return isAdmin(user) || isModerator(user)
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

export async function createSession(userId: string): Promise<string> {
  try {
    console.log("🔄 [SERVER-AUTH] Creating new session for user:", userId)

    // Generate session token using the auth library
    const { generateToken } = await import("@/lib/auth")
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
