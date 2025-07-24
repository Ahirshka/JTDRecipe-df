import { cookies } from "next/headers"
import { verifyToken, type AuthUser } from "./auth"
import { findUserById } from "./neon"

// Get current user from request - Server Component only
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return null
    }

    const user = verifyToken(token)
    if (!user) {
      return null
    }

    // Verify user still exists in database
    const dbUser = await findUserById(user.id)
    if (!dbUser) {
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
    console.error("Error getting current user:", error)
    return null
  }
}

// Middleware helper - Server Component only
export async function requireAuth(requiredRole?: string): Promise<{ user: AuthUser | null; error?: string }> {
  const { hasPermission } = await import("./auth")
  const user = await getCurrentUser()

  if (!user) {
    return { user: null, error: "Authentication required" }
  }

  if (requiredRole && !hasPermission(user.role, requiredRole)) {
    return { user: null, error: "Insufficient permissions" }
  }

  return { user }
}
