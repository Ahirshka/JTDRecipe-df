import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-development"

export interface ServerUser {
  id: string
  username: string
  email: string
  role: string
  status: string
  is_verified?: boolean
  created_at: string
  updated_at?: string
}

interface TokenPayload {
  userId: string
  email: string
  role: string
  username: string
  iat?: number
  exp?: number
}

// Get current user from cookies (server-side)
export async function getCurrentUser(): Promise<ServerUser | null> {
  try {
    console.log("🔄 [SERVER-AUTH] Getting current user from cookies")

    const cookieStore = await cookies()

    // Try multiple cookie names
    let token = cookieStore.get("auth-token")?.value
    if (!token) token = cookieStore.get("auth_token")?.value
    if (!token) token = cookieStore.get("session_token")?.value

    console.log("🔍 [SERVER-AUTH] Cookie search results:", {
      authToken: !!cookieStore.get("auth-token")?.value,
      authTokenAlt: !!cookieStore.get("auth_token")?.value,
      sessionToken: !!cookieStore.get("session_token")?.value,
      foundToken: !!token,
    })

    if (!token) {
      console.log("❌ [SERVER-AUTH] No auth token found in cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Auth token found, verifying...")

    // Verify JWT token
    let payload: TokenPayload
    try {
      payload = jwt.verify(token, JWT_SECRET, {
        issuer: "recipe-site",
        audience: "recipe-site-users",
      }) as TokenPayload

      console.log("✅ [SERVER-AUTH] Token verified:", {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      })
    } catch (jwtError) {
      console.log("❌ [SERVER-AUTH] JWT verification failed:", jwtError)
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
      updated_at: user.updated_at,
    }
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user:", error)
    return null
  }
}

// Get current user from request
export async function getCurrentUserFromRequest(request: NextRequest): Promise<ServerUser | null> {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user from request...")

    // Try multiple cookie names
    let token = request.cookies.get("auth-token")?.value
    if (!token) token = request.cookies.get("auth_token")?.value
    if (!token) token = request.cookies.get("session_token")?.value

    console.log("🔍 [SERVER-AUTH] Request cookie search results:", {
      authToken: !!request.cookies.get("auth-token")?.value,
      authTokenAlt: !!request.cookies.get("auth_token")?.value,
      sessionToken: !!request.cookies.get("session_token")?.value,
      foundToken: !!token,
    })

    if (!token) {
      console.log("❌ [SERVER-AUTH] No auth token found in request cookies")
      return null
    }

    console.log("✅ [SERVER-AUTH] Auth token found in request, verifying...")

    // Verify JWT token
    let payload: TokenPayload
    try {
      payload = jwt.verify(token, JWT_SECRET, {
        issuer: "recipe-site",
        audience: "recipe-site-users",
      }) as TokenPayload

      console.log("✅ [SERVER-AUTH] Request token verified:", {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      })
    } catch (jwtError) {
      console.log("❌ [SERVER-AUTH] Request JWT verification failed:", jwtError)
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
      console.log("❌ [SERVER-AUTH] User not found in database for ID:", payload.userId)
      return null
    }

    const user = users[0] as any
    console.log("✅ [SERVER-AUTH] User found from request:", {
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
      updated_at: user.updated_at,
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

// Require authentication from request
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
