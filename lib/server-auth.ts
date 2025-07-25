import { cookies } from "next/headers"
import { verifyToken } from "./auth"
import { findUserById } from "./neon"

export interface AuthUser {
  id: number
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
  is_profile_verified: boolean
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  created_at: string
  updated_at: string
  last_login_at?: string
}

// Get current user from request - SERVER ONLY
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    console.log("🔍 [SERVER-AUTH] Getting current user...")

    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()

    console.log(
      "🔍 [SERVER-AUTH] Available cookies:",
      allCookies.map((c) => c.name),
    )

    // Try multiple cookie names
    const possibleTokens = [
      cookieStore.get("auth-token")?.value,
      cookieStore.get("auth_token")?.value,
      cookieStore.get("session")?.value,
      cookieStore.get("token")?.value,
    ].filter(Boolean)

    console.log("🔍 [SERVER-AUTH] Found tokens:", possibleTokens.length)

    if (possibleTokens.length === 0) {
      console.log("❌ [SERVER-AUTH] No authentication tokens found")
      return null
    }

    // Try each token until one works
    for (const token of possibleTokens) {
      if (!token) continue

      console.log("🔍 [SERVER-AUTH] Verifying token:", token.substring(0, 20) + "...")

      const decoded = verifyToken(token)
      if (!decoded) {
        console.log("❌ [SERVER-AUTH] Token verification failed")
        continue
      }

      console.log("✅ [SERVER-AUTH] Token verified for user:", decoded.id)

      // Verify user still exists in database
      const dbUser = await findUserById(decoded.id)
      if (!dbUser) {
        console.log("❌ [SERVER-AUTH] User not found in database:", decoded.id)
        continue
      }

      console.log("✅ [SERVER-AUTH] User found in database:", {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
      })

      const authUser: AuthUser = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        is_verified: dbUser.is_verified,
        is_profile_verified: dbUser.is_profile_verified,
        avatar_url: dbUser.avatar_url,
        bio: dbUser.bio,
        location: dbUser.location,
        website: dbUser.website,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at,
        last_login_at: dbUser.last_login_at,
      }

      console.log("✅ [SERVER-AUTH] Returning authenticated user")
      return authUser
    }

    console.log("❌ [SERVER-AUTH] No valid tokens found")
    return null
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting current user:", error)
    return null
  }
}

// Middleware helper - SERVER ONLY
export async function requireAuth(requiredRole?: string): Promise<{ user: AuthUser | null; error?: string }> {
  try {
    console.log("🔍 [SERVER-AUTH] Requiring authentication, role:", requiredRole || "any")

    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ [SERVER-AUTH] Authentication required but no user found")
      return { user: null, error: "Authentication required" }
    }

    if (user.status !== "active") {
      console.log("❌ [SERVER-AUTH] User account not active:", user.status)
      return { user: null, error: "Account not active" }
    }

    if (requiredRole) {
      const hasPermission = checkUserPermission(user.role, requiredRole)
      if (!hasPermission) {
        console.log("❌ [SERVER-AUTH] Insufficient permissions:", {
          userRole: user.role,
          requiredRole,
        })
        return { user: null, error: "Insufficient permissions" }
      }
    }

    console.log("✅ [SERVER-AUTH] Authentication successful")
    return { user }
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error in requireAuth:", error)
    return { user: null, error: "Authentication failed" }
  }
}

// Check user permissions
function checkUserPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    user: 1,
    verified: 2,
    moderator: 3,
    admin: 4,
    owner: 5,
  }

  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  return userLevel >= requiredLevel
}

// Set authentication cookie - SERVER ONLY
export async function setAuthCookie(token: string): Promise<void> {
  try {
    const cookieStore = cookies()

    // Set multiple cookie formats for compatibility
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ [SERVER-AUTH] Authentication cookies set")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error setting auth cookie:", error)
  }
}

// Clear authentication cookie - SERVER ONLY
export async function clearAuthCookie(): Promise<void> {
  try {
    const cookieStore = cookies()

    // Clear all possible cookie names
    const cookieNames = ["auth-token", "auth_token", "session", "token"]

    for (const name of cookieNames) {
      cookieStore.set(name, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      })
    }

    console.log("✅ [SERVER-AUTH] Authentication cookies cleared")
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error clearing auth cookies:", error)
  }
}

// Get user from token - SERVER ONLY
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    console.log("🔍 [SERVER-AUTH] Getting user from token")

    const decoded = verifyToken(token)
    if (!decoded) {
      console.log("❌ [SERVER-AUTH] Invalid token")
      return null
    }

    const dbUser = await findUserById(decoded.id)
    if (!dbUser) {
      console.log("❌ [SERVER-AUTH] User not found")
      return null
    }

    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      is_verified: dbUser.is_verified,
      is_profile_verified: dbUser.is_profile_verified,
      avatar_url: dbUser.avatar_url,
      bio: dbUser.bio,
      location: dbUser.location,
      website: dbUser.website,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at,
      last_login_at: dbUser.last_login_at,
    }
  } catch (error) {
    console.error("❌ [SERVER-AUTH] Error getting user from token:", error)
    return null
  }
}
