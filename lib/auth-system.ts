import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"
import {
  sql,
  findUserByEmail,
  findUserByUsername,
  createUser as createUserInDB,
  validateSession,
  deleteSession,
  type User,
  type Session,
} from "./neon"

// Re-export createUser for external use
export { createUser } from "./neon"

// Auth interfaces
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
  role?: string
}

export interface AuthResult {
  success: boolean
  message: string
  user?: User
  error?: string
}

export interface SessionResult {
  success: boolean
  user?: User
  session?: Session
  error?: string
}

// Cookie configuration - ensure this matches across all files
const COOKIE_NAME = "auth_session"
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
}

// Create session and set cookie
export async function createSession(userId: number): Promise<{ token: string; expires: Date } | null> {
  console.log(`🔄 [AUTH] Creating session for user ID: ${userId}`)

  try {
    // Ensure sessions table exists
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    // Generate random token
    const token = randomBytes(32).toString("hex")

    // Set expiration to 7 days from now
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    // Create session in database
    await sql`
      INSERT INTO sessions (user_id, token, expires)
      VALUES (${userId}, ${token}, ${expires.toISOString()});
    `

    console.log(`✅ [AUTH] Session created for user ID: ${userId}`)

    return {
      token,
      expires,
    }
  } catch (error) {
    console.error(`❌ [AUTH] Error creating session:`, error)
    throw error
  }
}

// Login user
export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  console.log("🔄 [AUTH] Attempting login for:", credentials.email)

  try {
    // Find user by email
    const user = await findUserByEmail(credentials.email)
    if (!user) {
      console.log("❌ [AUTH] User not found")
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    console.log("🔍 [AUTH] Found user:", {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    })

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)
    if (!isValidPassword) {
      console.log("❌ [AUTH] Invalid password")
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    console.log("✅ [AUTH] Password verified")

    // Check user status
    if (user.status !== "active") {
      console.log("❌ [AUTH] User account is not active")
      return {
        success: false,
        message: "Account is not active",
      }
    }

    // Create session
    const sessionData = await createSession(user.id)
    if (!sessionData) {
      console.log("❌ [AUTH] Failed to create session")
      return {
        success: false,
        message: "Failed to create session",
      }
    }

    console.log("✅ [AUTH] Session created:", sessionData.token.substring(0, 10) + "...")

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, sessionData.token, COOKIE_OPTIONS)

    console.log("✅ [AUTH] Cookie set successfully")
    console.log("✅ [AUTH] Login successful for:", user.username)

    return {
      success: true,
      message: "Login successful",
      user,
    }
  } catch (error) {
    console.error("❌ [AUTH] Login error:", error)
    return {
      success: false,
      message: "Login failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Register user
export async function registerUser(userData: RegisterData): Promise<AuthResult> {
  console.log("🔄 [AUTH] Attempting registration for:", userData.username)

  try {
    // Check if user already exists
    const existingUserByEmail = await findUserByEmail(userData.email)
    if (existingUserByEmail) {
      return {
        success: false,
        message: "Email already registered",
      }
    }

    const existingUserByUsername = await findUserByUsername(userData.username)
    if (existingUserByUsername) {
      return {
        success: false,
        message: "Username already taken",
      }
    }

    // Create user
    const user = await createUserInDB({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || "user",
      status: "active",
      is_verified: false,
    })

    if (!user) {
      return {
        success: false,
        message: "Failed to create user",
      }
    }

    console.log("✅ [AUTH] Registration successful for:", user.username)
    return {
      success: true,
      message: "Registration successful",
      user,
    }
  } catch (error) {
    console.error("❌ [AUTH] Registration error:", error)
    return {
      success: false,
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Get current session
export async function getCurrentSession(): Promise<SessionResult> {
  console.log("🔄 [AUTH] Getting current session")

  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value

    if (!sessionToken) {
      console.log("❌ [AUTH] No session token found in cookies")
      return {
        success: false,
        error: "No session token",
      }
    }

    console.log("🔍 [AUTH] Found session token:", sessionToken.substring(0, 10) + "...")

    // Validate session
    const sessionData = await validateSession(sessionToken)
    if (!sessionData) {
      console.log("❌ [AUTH] Invalid session")
      // Clear invalid cookie
      cookieStore.delete(COOKIE_NAME)
      return {
        success: false,
        error: "Invalid session",
      }
    }

    console.log("✅ [AUTH] Valid session found for:", sessionData.user.username)
    return {
      success: true,
      user: sessionData.user,
      session: sessionData.session,
    }
  } catch (error) {
    console.error("❌ [AUTH] Session validation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Logout user
export async function logoutUser(): Promise<{ success: boolean; message: string }> {
  console.log("🔄 [AUTH] Logging out user")

  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(COOKIE_NAME)?.value

    if (sessionToken) {
      // Delete session from database
      await deleteSession(sessionToken)
      console.log("✅ [AUTH] Session deleted from database")
    }

    // Clear cookie
    cookieStore.delete(COOKIE_NAME)
    console.log("✅ [AUTH] Cookie cleared")

    console.log("✅ [AUTH] Logout successful")
    return {
      success: true,
      message: "Logout successful",
    }
  } catch (error) {
    console.error("❌ [AUTH] Logout error:", error)
    return {
      success: false,
      message: "Logout failed",
    }
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession()
  return session.success
}

// Check if user has specific role
export async function hasRole(requiredRole: string): Promise<boolean> {
  const session = await getCurrentSession()
  if (!session.success || !session.user) {
    return false
  }

  return session.user.role === requiredRole
}

// Check if user is owner
export async function isOwner(): Promise<boolean> {
  return await hasRole("owner")
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await getCurrentSession()
  if (!session.success || !session.user) {
    return false
  }

  return session.user.role === "owner" || session.user.role === "admin"
}

// Require authentication middleware
export async function requireAuth(): Promise<User | null> {
  const session = await getCurrentSession()
  if (!session.success || !session.user) {
    return null
  }

  return session.user
}

// Require specific role middleware
export async function requireRole(requiredRole: string): Promise<User | null> {
  const user = await requireAuth()
  if (!user || user.role !== requiredRole) {
    return null
  }

  return user
}

// Require admin access
export async function requireAdmin(): Promise<User | null> {
  const user = await requireAuth()
  if (!user || (user.role !== "owner" && user.role !== "admin")) {
    return null
  }

  return user
}
