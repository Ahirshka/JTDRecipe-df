import { cookies } from "next/headers"
import { verifyToken, type AuthUser } from "./auth"
import { findUserById } from "./neon"

// Get current user from request - SERVER ONLY
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("❌ No auth token found in cookies")
      return null
    }

    console.log("🔍 Found auth token, verifying...")
    const user = verifyToken(token)
    if (!user) {
      console.log("❌ Token verification failed")
      return null
    }

    console.log("✅ Token verified, checking database...")
    // Verify user still exists in database
    const dbUser = await findUserById(user.id)
    if (!dbUser) {
      console.log("❌ User not found in database")
      return null
    }

    console.log(`✅ User found: ${dbUser.username} (${dbUser.email})`)
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
    console.error("❌ Error getting current user:", error)
    return null
  }
}

// Middleware helper - SERVER ONLY
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

// Get auth token from cookies - SERVER ONLY
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    return cookieStore.get("auth-token")?.value || null
  } catch (error) {
    console.error("Error getting auth token:", error)
    return null
  }
}

// Set auth token in cookies - SERVER ONLY
export async function setAuthToken(token: string): Promise<void> {
  try {
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })
  } catch (error) {
    console.error("Error setting auth token:", error)
  }
}

// Clear auth token from cookies - SERVER ONLY
export async function clearAuthToken(): Promise<void> {
  try {
    const cookieStore = cookies()
    cookieStore.delete("auth-token")
  } catch (error) {
    console.error("Error clearing auth token:", error)
  }
}
