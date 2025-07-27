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
  password_hash: string
  role: string
  status: string
  is_verified: boolean
  created_at: string
  updated_at: string
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
  error?: string
}

// Create user function (required export)
export async function createUser(userData: {
  username: string
  email: string
  password: string
  role?: string
  status?: string
  is_verified?: boolean
}): Promise<User | null> {
  console.log("👤 [AUTH-SYSTEM] Creating user:", userData.username)

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12)

    // Create user in database
    const result = await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES (
        ${userData.username}, 
        ${userData.email}, 
        ${passwordHash}, 
        ${userData.role || "user"}, 
        ${userData.status || "active"}, 
        ${userData.is_verified !== undefined ? userData.is_verified : true}
      )
      RETURNING id, username, email, password_hash, role, status, is_verified, created_at, updated_at
    `

    if (result.length === 0) {
      console.log("❌ [AUTH-SYSTEM] Failed to create user")
      return null
    }

    const user = result[0] as User
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

// Generate JWT token
export function generateToken(payload: { userId: string; email: string; role: string }): string {
  console.log("🔑 [AUTH-SYSTEM] Generating JWT token for user:", payload.userId)

  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: "recipe-site",
      audience: "recipe-site-users",
    })

    console.log("✅ [AUTH-SYSTEM] JWT token generated successfully")
    return token
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] JWT token generation failed:", error)
    throw new Error("Failed to generate authentication token")
  }
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string; role: string } | null {
  console.log("🔍 [AUTH-SYSTEM] Verifying JWT token:", token.substring(0, 20) + "...")

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "recipe-site",
      audience: "recipe-site-users",
    }) as any

    console.log("✅ [AUTH-SYSTEM] JWT token verified successfully:", {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    })

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("❌ [AUTH-SYSTEM] JWT token expired:", error.expiredAt)
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log("❌ [AUTH-SYSTEM] Invalid JWT token:", error.message)
    } else {
      console.log("❌ [AUTH-SYSTEM] JWT token verification error:", error)
    }
    return null
  }
}

// Set authentication cookie
export async function setAuthCookie(token: string): Promise<void> {
  console.log("🍪 [AUTH-SYSTEM] Setting authentication cookie")

  try {
    const cookieStore = await cookies()

    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("✅ [AUTH-SYSTEM] Authentication cookie set successfully")
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Failed to set authentication cookie:", error)
    throw error
  }
}

// Clear authentication cookie
export async function clearAuthCookie(): Promise<void> {
  console.log("🗑️ [AUTH-SYSTEM] Clearing authentication cookie")

  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")
    console.log("✅ [AUTH-SYSTEM] Authentication cookie cleared successfully")
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Failed to clear authentication cookie:", error)
    throw error
  }
}

// Get current session from cookies
export async function getCurrentSession(): Promise<SessionResult> {
  console.log("🔄 [AUTH-SYSTEM] Getting current session from cookies")

  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("❌ [AUTH-SYSTEM] No authentication token found in cookies")
      return {
        success: false,
        error: "No authentication token found",
      }
    }

    console.log("🔍 [AUTH-SYSTEM] Found auth token, verifying...")

    // Verify the token
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [AUTH-SYSTEM] Invalid or expired token")
      return {
        success: false,
        error: "Invalid or expired token",
      }
    }

    console.log("🔍 [AUTH-SYSTEM] Token verified, looking up user:", payload.userId)

    // Get user from database
    const users = await sql`
      SELECT id, username, email, password_hash, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE id = ${payload.userId}
      AND status = 'active'
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-SYSTEM] User not found or inactive:", payload.userId)
      return {
        success: false,
        error: "User not found or inactive",
      }
    }

    const user = users[0] as User
    console.log("✅ [AUTH-SYSTEM] Session validated successfully:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return {
      success: true,
      user,
    }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Session validation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Session validation failed",
    }
  }
}

// Register user
export async function registerUser(userData: {
  username: string
  email: string
  password: string
  role?: string
}): Promise<AuthResult> {
  console.log("👤 [AUTH-SYSTEM] Registering user:", userData.username)

  try {
    // Validate input
    if (!userData.username || !userData.email || !userData.password) {
      return {
        success: false,
        message: "Username, email, and password are required",
      }
    }

    if (userData.password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long",
      }
    }

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE email = ${userData.email} OR username = ${userData.username}
    `

    if (existingUsers.length > 0) {
      return {
        success: false,
        message: "User with this email or username already exists",
      }
    }

    // Create user using the createUser function
    const user = await createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: userData.role || "user",
      status: "active",
      is_verified: true,
    })

    if (!user) {
      return {
        success: false,
        message: "Failed to create user account",
      }
    }

    console.log("✅ [AUTH-SYSTEM] User registered successfully:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    return {
      success: true,
      message: "User registered successfully",
      user,
    }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Registration error:", error)
    return {
      success: false,
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Login user
export async function loginUser(credentials: { email: string; password: string }): Promise<AuthResult> {
  console.log("🔐 [AUTH-SYSTEM] Attempting login for:", credentials.email)

  try {
    // Validate input
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        message: "Email and password are required",
      }
    }

    // Find user by email
    console.log("🔍 [AUTH-SYSTEM] Looking up user by email...")
    const users = await sql`
      SELECT id, username, email, password_hash, role, status, is_verified, created_at, updated_at
      FROM users 
      WHERE email = ${credentials.email}
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-SYSTEM] User not found:", credentials.email)
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    const user = users[0] as User
    console.log("✅ [AUTH-SYSTEM] User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    // Check if user is active
    if (user.status !== "active") {
      console.log("❌ [AUTH-SYSTEM] User account is not active:", user.status)
      return {
        success: false,
        message: "Account is not active",
      }
    }

    // Verify password
    console.log("🔐 [AUTH-SYSTEM] Verifying password...")
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)

    if (!isPasswordValid) {
      console.log("❌ [AUTH-SYSTEM] Password verification failed")
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    console.log("✅ [AUTH-SYSTEM] Password verified successfully")

    // Generate JWT token
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
    })

    // Set authentication cookie
    await setAuthCookie(token)

    // Update last login time
    await sql`
      UPDATE users 
      SET updated_at = NOW()
      WHERE id = ${user.id}
    `

    console.log("✅ [AUTH-SYSTEM] Login successful for:", user.username)

    return {
      success: true,
      message: "Login successful",
      user,
    }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Login error:", error)
    return {
      success: false,
      message: "Login failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Logout user
export async function logoutUser(): Promise<AuthResult> {
  console.log("🚪 [AUTH-SYSTEM] Logging out user")

  try {
    await clearAuthCookie()

    console.log("✅ [AUTH-SYSTEM] Logout successful")

    return {
      success: true,
      message: "Logout successful",
    }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Logout error:", error)
    return {
      success: false,
      message: "Logout failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Initialize database and create owner account
export async function initializeAuthSystem(): Promise<{ success: boolean; message: string }> {
  console.log("🔄 [AUTH-SYSTEM] Initializing authentication system...")

  try {
    // Ensure users table exists
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `

    // Check if owner account exists
    const ownerExists = await sql`
      SELECT id FROM users WHERE role = 'owner' LIMIT 1
    `

    if (ownerExists.length === 0) {
      console.log("👤 [AUTH-SYSTEM] Creating owner account...")

      // Create owner account
      const ownerResult = await registerUser({
        username: "aaronhirshka",
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
      })

      if (!ownerResult.success) {
        throw new Error(`Failed to create owner account: ${ownerResult.message}`)
      }

      console.log("✅ [AUTH-SYSTEM] Owner account created successfully")
    } else {
      console.log("✅ [AUTH-SYSTEM] Owner account already exists")
    }

    return {
      success: true,
      message: "Authentication system initialized successfully",
    }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Initialization error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Initialization failed",
    }
  }
}

// Verify user has required role
export function hasRole(user: User | null, requiredRole: string): boolean {
  if (!user) return false

  const roleHierarchy: Record<string, number> = {
    user: 1,
    verified: 2,
    moderator: 3,
    admin: 4,
    owner: 5,
  }

  const userLevel = roleHierarchy[user.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  return userLevel >= requiredLevel
}

// Check if user is admin
export function isAdmin(user: User | null): boolean {
  return hasRole(user, "admin")
}

// Check if user is owner
export function isOwner(user: User | null): boolean {
  return user?.role === "owner"
}

// Find user by email (required export)
export async function findUserByEmail(email: string): Promise<User | null> {
  console.log("🔍 [AUTH-SYSTEM] Finding user by email:", email)

  try {
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

// Find user by username (required export)
export async function findUserByUsername(username: string): Promise<User | null> {
  console.log("🔍 [AUTH-SYSTEM] Finding user by username:", username)

  try {
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

// Validate session (required export)
export async function validateSession(token: string): Promise<{ user: User; session: any } | null> {
  console.log("🔍 [AUTH-SYSTEM] Validating session token")

  try {
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await findUserByEmail(payload.email)
    if (!user || user.status !== "active") {
      return null
    }

    return {
      user,
      session: { token, expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    }
  } catch (error) {
    console.error("❌ [AUTH-SYSTEM] Session validation error:", error)
    return null
  }
}

// Delete session (required export)
export async function deleteSession(token: string): Promise<void> {
  console.log("🗑️ [AUTH-SYSTEM] Deleting session token")
  // Since we're using JWT tokens, we just need to clear the cookie
  // The token will expire naturally
  await clearAuthCookie()
}
