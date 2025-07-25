import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  user: 1,
  verified: 2,
  moderator: 3,
  admin: 4,
  owner: 5,
} as const

export type UserRole = keyof typeof ROLE_HIERARCHY

export interface User {
  id: string
  email: string
  username: string
  password_hash: string
  role: UserRole
  is_verified: boolean
  is_suspended: boolean
  is_banned: boolean
  suspension_reason?: string
  suspension_until?: Date
  created_at: Date
  updated_at: Date
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  message?: string
}

// Check if a user has permission based on role hierarchy
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0

  return userLevel >= requiredLevel
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is required")
    }

    return jwt.verify(token, process.env.JWT_SECRET)
  } catch (error) {
    console.error("Error verifying token:", error)
    return null
  }
}

// Check if a user can moderate another user
export function canModerateUser(moderatorRole: UserRole, targetRole: UserRole): boolean {
  const moderatorLevel = ROLE_HIERARCHY[moderatorRole]
  const targetLevel = ROLE_HIERARCHY[targetRole]
  return moderatorLevel > targetLevel
}

// Get all users for moderation panel
export async function getAllUsersForModeration(): Promise<User[]> {
  try {
    const result = await sql`
      SELECT id, email, username, role, is_verified, is_suspended, is_banned,
             suspension_reason, suspension_until, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `
    return result as User[]
  } catch (error) {
    console.error("Error fetching users for moderation:", error)
    return []
  }
}

// Suspend a user
export async function suspendUser(
  userId: string,
  reason: string,
  duration?: number,
): Promise<{ success: boolean; message: string }> {
  try {
    const suspensionUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null

    await sql`
      UPDATE users 
      SET is_suspended = true, 
          suspension_reason = ${reason},
          suspension_until = ${suspensionUntil?.toISOString() || null},
          updated_at = NOW()
      WHERE id = ${userId}
    `

    // Log the moderation action
    await sql`
      INSERT INTO moderation_log (user_id, action, reason, moderator_id, created_at)
      VALUES (${userId}, 'suspend', ${reason}, 'system', NOW())
    `

    return { success: true, message: "User suspended successfully" }
  } catch (error) {
    console.error("Error suspending user:", error)
    return { success: false, message: "Failed to suspend user" }
  }
}

// Unsuspend a user
export async function unsuspendUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    await sql`
      UPDATE users 
      SET is_suspended = false, 
          suspension_reason = NULL,
          suspension_until = NULL,
          updated_at = NOW()
      WHERE id = ${userId}
    `

    // Log the moderation action
    await sql`
      INSERT INTO moderation_log (user_id, action, reason, moderator_id, created_at)
      VALUES (${userId}, 'unsuspend', 'Suspension lifted', 'system', NOW())
    `

    return { success: true, message: "User unsuspended successfully" }
  } catch (error) {
    console.error("Error unsuspending user:", error)
    return { success: false, message: "Failed to unsuspend user" }
  }
}

// Ban a user permanently
export async function banUser(userId: string, reason: string): Promise<{ success: boolean; message: string }> {
  try {
    await sql`
      UPDATE users 
      SET is_banned = true, 
          suspension_reason = ${reason},
          updated_at = NOW()
      WHERE id = ${userId}
    `

    // Log the moderation action
    await sql`
      INSERT INTO moderation_log (user_id, action, reason, moderator_id, created_at)
      VALUES (${userId}, 'ban', ${reason}, 'system', NOW())
    `

    return { success: true, message: "User banned successfully" }
  } catch (error) {
    console.error("Error banning user:", error)
    return { success: false, message: "Failed to ban user" }
  }
}

// Change user role
export async function changeUserRole(
  userId: string,
  newRole: UserRole,
): Promise<{ success: boolean; message: string }> {
  try {
    await sql`
      UPDATE users 
      SET role = ${newRole}, 
          updated_at = NOW()
      WHERE id = ${userId}
    `

    // Log the moderation action
    await sql`
      INSERT INTO moderation_log (user_id, action, reason, moderator_id, created_at)
      VALUES (${userId}, 'role_change', ${"Role changed to " + newRole}, 'system', NOW())
    `

    return { success: true, message: "User role updated successfully" }
  } catch (error) {
    console.error("Error changing user role:", error)
    return { success: false, message: "Failed to change user role" }
  }
}

// Verify a user
export async function verifyUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    await sql`
      UPDATE users 
      SET is_verified = true, 
          updated_at = NOW()
      WHERE id = ${userId}
    `

    return { success: true, message: "User verified successfully" }
  } catch (error) {
    console.error("Error verifying user:", error)
    return { success: false, message: "Failed to verify user" }
  }
}

// Warn a user
export async function warnUser(userId: string, reason: string): Promise<{ success: boolean; message: string }> {
  try {
    // Log the warning
    await sql`
      INSERT INTO moderation_log (user_id, action, reason, moderator_id, created_at)
      VALUES (${userId}, 'warn', ${reason}, 'system', NOW())
    `

    return { success: true, message: "User warned successfully" }
  } catch (error) {
    console.error("Error warning user:", error)
    return { success: false, message: "Failed to warn user" }
  }
}

// Save/create a new user
export async function saveUser(userData: {
  email: string
  username: string
  password: string
  role?: UserRole
}): Promise<AuthResult> {
  try {
    // Validate input
    if (!isValidEmail(userData.email)) {
      return { success: false, message: "Invalid email format" }
    }

    if (!isValidPassword(userData.password)) {
      return { success: false, message: "Password must be at least 8 characters long" }
    }

    if (!isValidUsername(userData.username)) {
      return { success: false, message: "Username must be 3-30 characters, alphanumeric and underscores only" }
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(userData.email)
    if (existingUser) {
      return { success: false, message: "User with this email already exists" }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12)
    const userId = generateId()

    // Create user
    await sql`
      INSERT INTO users (id, email, username, password_hash, role, is_verified, created_at, updated_at)
      VALUES (${userId}, ${userData.email}, ${userData.username}, ${passwordHash}, 
              ${userData.role || "user"}, false, NOW(), NOW())
    `

    const user = await findUserByEmail(userData.email)
    if (!user) {
      return { success: false, message: "Failed to create user" }
    }

    return { success: true, user, message: "User created successfully" }
  } catch (error) {
    console.error("Error saving user:", error)
    return { success: false, message: "Failed to create user" }
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT id, email, username, password_hash, role, is_verified, is_suspended, is_banned,
             suspension_reason, suspension_until, created_at, updated_at
      FROM users 
      WHERE email = ${email}
      LIMIT 1
    `

    if (result.length === 0) return null

    const user = result[0] as any
    return {
      ...user,
      suspension_until: user.suspension_until ? new Date(user.suspension_until) : undefined,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at),
    }
  } catch (error) {
    console.error("Error finding user by email:", error)
    return null
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await findUserByEmail(email)
    if (!user) {
      return { success: false, message: "Invalid email or password" }
    }

    // Check if user is banned
    if (user.is_banned) {
      return { success: false, message: "Account is banned" }
    }

    // Check if user is suspended
    if (user.is_suspended) {
      if (user.suspension_until && user.suspension_until > new Date()) {
        return { success: false, message: "Account is suspended" }
      } else if (user.suspension_until && user.suspension_until <= new Date()) {
        // Auto-unsuspend if suspension period has ended
        await unsuspendUser(user.id)
        user.is_suspended = false
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, message: "Invalid email or password" }
    }

    // Generate JWT token
    const token = generateJWT(user)

    // Create session
    await createSession(user.id, token)

    return { success: true, user, token, message: "Login successful" }
  } catch (error) {
    console.error("Error logging in user:", error)
    return { success: false, message: "Login failed" }
  }
}

// Logout user
export async function logoutUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Delete all sessions for the user
    await sql`
      DELETE FROM user_sessions 
      WHERE user_id = ${userId}
    `

    return { success: true, message: "Logout successful" }
  } catch (error) {
    console.error("Error logging out user:", error)
    return { success: false, message: "Logout failed" }
  }
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPassword(password: string): boolean {
  return password.length >= 8
}

function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function generateJWT(user: User): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required")
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  }

  return jwt.sign(payload, process.env.JWT_SECRET)
}

async function createSession(userId: string, token: string): Promise<void> {
  const sessionId = generateId()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await sql`
    INSERT INTO user_sessions (id, user_id, token, expires_at, created_at)
    VALUES (${sessionId}, ${userId}, ${token}, ${expiresAt.toISOString()}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      token = ${token},
      expires_at = ${expiresAt.toISOString()},
      created_at = NOW()
  `
}

// Get current user from token
export async function getCurrentUserFromToken(token: string): Promise<User | null> {
  try {
    const payload = verifyToken(token)
    if (!payload) return null

    return await findUserByEmail(payload.email)
  } catch (error) {
    console.error("Error getting current user from token:", error)
    return null
  }
}
