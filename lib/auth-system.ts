import bcrypt from "bcryptjs"
import { sql } from "./neon"
import crypto from "crypto"

// User types
export interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  role?: string
  status?: string
  is_verified?: boolean
}

export interface LoginResult {
  success: boolean
  error?: string
  details?: string
  user?: User
  sessionToken?: string
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  console.log("🔐 [AUTH] Hashing password...")
  const saltRounds = 12
  const hash = await bcrypt.hash(password, saltRounds)
  console.log("✅ [AUTH] Password hashed successfully")
  return hash
}

// Verify password with bcrypt
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.log("🔐 [AUTH] Verifying password...")
  try {
    const isValid = await bcrypt.compare(password, hash)
    console.log(`${isValid ? "✅" : "❌"} [AUTH] Password verification: ${isValid ? "valid" : "invalid"}`)
    return isValid
  } catch (error) {
    console.error("❌ [AUTH] Password verification error:", error)
    return false
  }
}

// Create a new user
export async function createUser(userData: CreateUserData): Promise<LoginResult> {
  console.log("👤 [AUTH] Creating user:", userData.email)

  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id, email, username FROM users 
      WHERE email = ${userData.email} OR username = ${userData.username}
    `

    if (existingUser.length > 0) {
      const existing = existingUser[0]
      const conflict = existing.email === userData.email ? "email" : "username"
      console.log(`❌ [AUTH] User creation failed: ${conflict} already exists`)
      return {
        success: false,
        error: `User with this ${conflict} already exists`,
      }
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password)

    // Create user
    const newUser = await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES (
        ${userData.username},
        ${userData.email},
        ${passwordHash},
        ${userData.role || "user"},
        ${userData.status || "active"},
        ${userData.is_verified || false}
      )
      RETURNING id, username, email, role, status, is_verified, created_at, updated_at
    `

    if (newUser.length === 0) {
      console.log("❌ [AUTH] User creation failed: No user returned")
      return {
        success: false,
        error: "Failed to create user",
      }
    }

    const user = newUser[0] as User
    console.log("✅ [AUTH] User created successfully:", user.id)

    return {
      success: true,
      user,
    }
  } catch (error) {
    console.error("❌ [AUTH] User creation error:", error)
    return {
      success: false,
      error: "Database error during user creation",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  console.log("🔍 [AUTH] Finding user by email:", email)

  try {
    const users = await sql`
      SELECT id, username, email, password_hash, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      console.log("❌ [AUTH] User not found")
      return null
    }

    const user = users[0] as User & { password_hash: string }
    console.log("✅ [AUTH] User found:", user.id)
    return user
  } catch (error) {
    console.error("❌ [AUTH] Error finding user:", error)
    return null
  }
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Create session
export async function createSession(userId: number): Promise<string | null> {
  console.log("🎫 [AUTH] Creating session for user:", userId)

  try {
    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
    `

    console.log("✅ [AUTH] Session created successfully")
    return token
  } catch (error) {
    console.error("❌ [AUTH] Session creation error:", error)
    return null
  }
}

// Validate session
export async function validateSession(token: string): Promise<User | null> {
  console.log("🎫 [AUTH] Validating session token")

  try {
    const sessions = await sql`
      SELECT s.user_id, s.expires_at, u.id, u.username, u.email, u.role, u.status, u.is_verified, u.created_at, u.updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `

    if (sessions.length === 0) {
      console.log("❌ [AUTH] Invalid or expired session")
      return null
    }

    const session = sessions[0]
    const user: User = {
      id: session.id,
      username: session.username,
      email: session.email,
      role: session.role,
      status: session.status,
      is_verified: session.is_verified,
      created_at: session.created_at,
      updated_at: session.updated_at,
    }

    console.log("✅ [AUTH] Session valid for user:", user.id)
    return user
  } catch (error) {
    console.error("❌ [AUTH] Session validation error:", error)
    return null
  }
}

// Delete session
export async function deleteSession(token: string): Promise<boolean> {
  console.log("🗑️ [AUTH] Deleting session")

  try {
    await sql`DELETE FROM sessions WHERE token = ${token}`
    console.log("✅ [AUTH] Session deleted successfully")
    return true
  } catch (error) {
    console.error("❌ [AUTH] Session deletion error:", error)
    return false
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  console.log("🔐 [AUTH] Attempting login for:", email)

  try {
    // Find user
    const user = (await findUserByEmail(email)) as (User & { password_hash: string }) | null

    if (!user) {
      console.log("❌ [AUTH] Login failed: User not found")
      return {
        success: false,
        error: "Invalid email or password",
      }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      console.log("❌ [AUTH] Login failed: Invalid password")
      return {
        success: false,
        error: "Invalid email or password",
      }
    }

    // Check user status
    if (user.status !== "active") {
      console.log("❌ [AUTH] Login failed: User not active")
      return {
        success: false,
        error: "Account is not active",
      }
    }

    // Create session
    const sessionToken = await createSession(user.id)

    if (!sessionToken) {
      console.log("❌ [AUTH] Login failed: Could not create session")
      return {
        success: false,
        error: "Failed to create session",
      }
    }

    // Remove password_hash from user object
    const { password_hash, ...userWithoutPassword } = user

    console.log("✅ [AUTH] Login successful for user:", user.id)

    return {
      success: true,
      user: userWithoutPassword,
      sessionToken,
    }
  } catch (error) {
    console.error("❌ [AUTH] Login error:", error)
    return {
      success: false,
      error: "Database error during login",
      details: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  console.log("🧹 [AUTH] Cleaning up expired sessions...")

  try {
    const result = await sql`DELETE FROM sessions WHERE expires_at <= NOW()`
    console.log(`✅ [AUTH] Cleaned up expired sessions`)
  } catch (error) {
    console.error("❌ [AUTH] Error cleaning up sessions:", error)
  }
}
