import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-development"
const JWT_EXPIRES_IN = "7d"

export interface User {
  id: number
  username: string
  email: string
  password_hash?: string
  role: string
  status: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface SessionResult {
  success: boolean
  user?: User
  error?: string
}

// Generate JWT token
export function generateToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  console.log("🔑 [AUTH-SYSTEM] Generating token for user:", payload.userId)

  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "recipe-site",
      audience: "recipe-site-users",
    })

    console.log("✅ [AUTH-SYSTEM] Token generated successfully")
    return token
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Token generation failed:", error)
    throw new Error("Failed to generate authentication token")
  }
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  console.log("🔍 [AUTH-SYSTEM] Verifying token:", token.substring(0, 20) + "...")

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "recipe-site",
      audience: "recipe-site-users",
    }) as TokenPayload

    console.log("✅ [AUTH-SYSTEM] Token verified successfully:", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : "No expiry",
    })

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("❌ [AUTH-SYSTEM] Token expired:", error.expiredAt)
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log("❌ [AUTH-SYSTEM] Invalid token:", error.message)
    } else {
      console.log("❌ [AUTH-SYSTEM] Token verification error:", error)
    }

    return null
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create user in database
export async function createUser(userData: {
  username: string
  email: string
  password: string
  role?: string
}): Promise<User | null> {
  try {
    console.log("👤 [AUTH-SYSTEM] Creating user:", userData.username)

    // Hash password
    const passwordHash = await hashPassword(userData.password)

    // Insert user into database
    const users = await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES (${userData.username}, ${userData.email}, ${passwordHash}, ${userData.role || "user"}, 'active', true)
      RETURNING id, username, email, role, status, is_verified, created_at, updated_at
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-SYSTEM] Failed to create user")
      return null
    }

    const user = users[0] as User
    console.log("✅ [AUTH-SYSTEM] User created successfully:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Error creating user:", error)
    return null
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("🔍 [AUTH-SYSTEM] Finding user by email:", email)

    const users = await sql`
      SELECT id, username, email, password_hash, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-SYSTEM] User not found by email:", email)
      return null
    }

    const user = users[0] as User
    console.log("✅ [AUTH-SYSTEM] User found by email:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Error finding user by email:", error)
    return null
  }
}

// Find user by username
export async function findUserByUsername(username: string): Promise<User | null> {
  try {
    console.log("🔍 [AUTH-SYSTEM] Finding user by username:", username)

    const users = await sql`
      SELECT id, username, email, password_hash, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE username = ${username}
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-SYSTEM] User not found by username:", username)
      return null
    }

    const user = users[0] as User
    console.log("✅ [AUTH-SYSTEM] User found by username:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Error finding user by username:", error)
    return null
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    console.log("🔐 [AUTH-SYSTEM] Attempting login for:", email)

    // Find user by email
    const user = await findUserByEmail(email)
    if (!user) {
      console.log("❌ [AUTH-SYSTEM] User not found for login:", email)
      return null
    }

    // Verify password
    if (!user.password_hash) {
      console.log("❌ [AUTH-SYSTEM] No password hash found for user:", email)
      return null
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      console.log("❌ [AUTH-SYSTEM] Invalid password for user:", email)
      return null
    }

    // Check user status
    if (user.status !== "active") {
      console.log("❌ [AUTH-SYSTEM] User account not active:", email)
      return null
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
    })

    // Update last login
    await sql`
      UPDATE users 
      SET updated_at = NOW() 
      WHERE id = ${user.id}
    `

    console.log("✅ [AUTH-SYSTEM] Login successful for:", email)

    return { user, token }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Login error:", error)
    return null
  }
}

// Register user
export async function registerUser(userData: {
  username: string
  email: string
  password: string
}): Promise<{ user: User; token: string } | null> {
  try {
    console.log("📝 [AUTH-SYSTEM] Registering user:", userData.username)

    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email)
    if (existingUser) {
      console.log("❌ [AUTH-SYSTEM] User already exists:", userData.email)
      return null
    }

    // Create user
    const user = await createUser(userData)
    if (!user) {
      console.log("❌ [AUTH-SYSTEM] Failed to create user:", userData.username)
      return null
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
    })

    console.log("✅ [AUTH-SYSTEM] Registration successful for:", userData.username)

    return { user, token }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Registration error:", error)
    return null
  }
}

// Get current session
export async function getCurrentSession(): Promise<SessionResult> {
  try {
    console.log("🔍 [AUTH-SYSTEM] Getting current session")

    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("❌ [AUTH-SYSTEM] No auth token found")
      return { success: false, error: "No authentication token" }
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [AUTH-SYSTEM] Invalid token")
      return { success: false, error: "Invalid authentication token" }
    }

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE id = ${payload.userId}
      AND status = 'active'
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-SYSTEM] User not found or inactive:", payload.userId)
      return { success: false, error: "User not found or inactive" }
    }

    const user = users[0] as User
    console.log("✅ [AUTH-SYSTEM] Current session retrieved:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return { success: true, user }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Error getting current session:", error)
    return { success: false, error: "Session error" }
  }
}

// Validate session
export async function validateSession(token: string): Promise<SessionResult> {
  try {
    console.log("🔍 [AUTH-SYSTEM] Validating session")

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [AUTH-SYSTEM] Invalid token")
      return { success: false, error: "Invalid token" }
    }

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE id = ${payload.userId}
      AND status = 'active'
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-SYSTEM] User not found or inactive:", payload.userId)
      return { success: false, error: "User not found or inactive" }
    }

    const user = users[0] as User
    console.log("✅ [AUTH-SYSTEM] Session validated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return { success: true, user }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Error validating session:", error)
    return { success: false, error: "Validation error" }
  }
}

// Delete session (logout)
export async function deleteSession(): Promise<boolean> {
  try {
    console.log("🔄 [AUTH-SYSTEM] Deleting session")

    const cookieStore = await cookies()
    cookieStore.delete("auth-token")

    console.log("✅ [AUTH-SYSTEM] Session deleted successfully")
    return true
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Error deleting session:", error)
    return false
  }
}

// Initialize auth system (create tables and owner account)
export async function initializeAuthSystem(): Promise<boolean> {
  try {
    console.log("🚀 [AUTH-SYSTEM] Initializing authentication system")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        is_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    console.log("✅ [AUTH-SYSTEM] Users table created/verified")

    // Check if owner account exists
    const ownerExists = await findUserByEmail("aaronhirshka@gmail.com")
    if (!ownerExists) {
      console.log("👑 [AUTH-SYSTEM] Creating owner account")

      const owner = await createUser({
        username: "owner",
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
      })

      if (owner) {
        console.log("✅ [AUTH-SYSTEM] Owner account created successfully")
      } else {
        console.log("❌ [AUTH-SYSTEM] Failed to create owner account")
        return false
      }
    } else {
      console.log("✅ [AUTH-SYSTEM] Owner account already exists")
    }

    console.log("🎉 [AUTH-SYSTEM] Authentication system initialized successfully")
    return true
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Error initializing auth system:", error)
    return false
  }
}
