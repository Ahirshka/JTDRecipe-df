import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import {
  findUserById,
  findUserByEmail as dbFindUserByEmail,
  createUser,
  updateUser,
  getAllUsers,
  type User,
} from "./neon"

// Role hierarchy with numeric levels (higher number = more permissions)
export const ROLE_HIERARCHY = {
  user: 1,
  moderator: 2,
  admin: 3,
  owner: 4,
} as const

export type Role = keyof typeof ROLE_HIERARCHY

// Check if user can moderate another user
export function canModerateUser(moderatorRole: string, targetRole: string): boolean {
  const moderatorLevel = ROLE_HIERARCHY[moderatorRole as Role] || 0
  const targetLevel = ROLE_HIERARCHY[targetRole as Role] || 0
  return moderatorLevel > targetLevel
}

// Check if user has permission based on role
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole as Role] || 0
  return userLevel >= requiredLevel
}

// Verify JWT token
export function verifyToken(token: string): any | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error("JWT_SECRET is not configured")
    }
    return jwt.verify(token, secret)
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// Generate JWT token
export function generateToken(payload: any, expiresIn = "7d"): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not configured")
  }
  return jwt.sign(payload, secret, { expiresIn })
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

// Validate username
export function isValidUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 50 && /^[a-zA-Z0-9_]+$/.test(username)
}

// Get all users for moderation
export async function getAllUsersForModeration(): Promise<User[]> {
  try {
    return await getAllUsers()
  } catch (error) {
    console.error("Error getting users for moderation:", error)
    return []
  }
}

// Suspend user
export async function suspendUser(
  userId: number,
  reason: string,
  duration: number, // hours
  moderatorId: number,
): Promise<boolean> {
  try {
    const suspensionExpiresAt = new Date()
    suspensionExpiresAt.setHours(suspensionExpiresAt.getHours() + duration)

    const updated = await updateUser(userId, {
      status: "suspended",
      suspension_reason: reason,
      suspension_expires_at: suspensionExpiresAt.toISOString(),
    })

    return !!updated
  } catch (error) {
    console.error("Error suspending user:", error)
    return false
  }
}

// Unsuspend user
export async function unsuspendUser(userId: number, moderatorId: number): Promise<boolean> {
  try {
    const updated = await updateUser(userId, {
      status: "active",
      suspension_reason: null,
      suspension_expires_at: null,
    })

    return !!updated
  } catch (error) {
    console.error("Error unsuspending user:", error)
    return false
  }
}

// Ban user permanently
export async function banUser(userId: number, reason: string, moderatorId: number): Promise<boolean> {
  try {
    const updated = await updateUser(userId, {
      status: "banned",
      suspension_reason: reason,
    })

    return !!updated
  } catch (error) {
    console.error("Error banning user:", error)
    return false
  }
}

// Change user role
export async function changeUserRole(userId: number, newRole: string, moderatorId: number): Promise<boolean> {
  try {
    const updated = await updateUser(userId, {
      role: newRole,
    })

    return !!updated
  } catch (error) {
    console.error("Error changing user role:", error)
    return false
  }
}

// Verify user
export async function verifyUser(userId: number): Promise<boolean> {
  try {
    const updated = await updateUser(userId, {
      is_verified: true,
    })

    return !!updated
  } catch (error) {
    console.error("Error verifying user:", error)
    return false
  }
}

// Warn user
export async function warnUser(userId: number, reason: string, moderatorId: number): Promise<boolean> {
  try {
    const user = await findUserById(userId)
    if (!user) return false

    const updated = await updateUser(userId, {
      warning_count: (user.warning_count || 0) + 1,
    })

    return !!updated
  } catch (error) {
    console.error("Error warning user:", error)
    return false
  }
}

// Save user (create new user)
export async function saveUser(userData: {
  username: string
  email: string
  password: string
  role?: string
}): Promise<User | null> {
  try {
    // Validate input
    if (!isValidEmail(userData.email)) {
      throw new Error("Invalid email format")
    }
    if (!isValidPassword(userData.password)) {
      throw new Error("Password must be at least 8 characters long")
    }
    if (!isValidUsername(userData.username)) {
      throw new Error("Username must be 3-50 characters and contain only letters, numbers, and underscores")
    }

    // Check if user already exists
    const existingUser = await dbFindUserByEmail(userData.email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password)

    // Create user
    const user = await createUser({
      username: userData.username,
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role || "user",
    })

    return user
  } catch (error) {
    console.error("Error saving user:", error)
    return null
  }
}

// Find user by email (wrapper)
export async function findUserByEmail(email: string): Promise<User | null> {
  return dbFindUserByEmail(email)
}

// Login user
export async function loginUser(
  email: string,
  password: string,
): Promise<{
  success: boolean
  user?: User
  token?: string
  error?: string
}> {
  try {
    // Find user
    const user = await dbFindUserByEmail(email)
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    // Check if user is banned or suspended
    if (user.status === "banned") {
      return { success: false, error: "Account is banned" }
    }
    if (user.status === "suspended") {
      const now = new Date()
      const suspensionExpires = user.suspension_expires_at ? new Date(user.suspension_expires_at) : null
      if (!suspensionExpires || now < suspensionExpires) {
        return { success: false, error: "Account is suspended" }
      } else {
        // Suspension expired, reactivate account
        await updateUser(user.id, {
          status: "active",
          suspension_reason: null,
          suspension_expires_at: null,
        })
      }
    }

    // Verify password
    if (!user.password_hash) {
      return { success: false, error: "Invalid account configuration" }
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" }
    }

    // Update last login
    await updateUser(user.id, {
      last_login_at: new Date().toISOString(),
    })

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      success: true,
      user: {
        ...user,
        password_hash: undefined, // Don't return password hash
      },
      token,
    }
  } catch (error) {
    console.error("Error logging in user:", error)
    return { success: false, error: "Login failed" }
  }
}

// Logout user
export async function logoutUser(token: string): Promise<boolean> {
  try {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return true since JWT tokens are stateless
    return true
  } catch (error) {
    console.error("Error logging out user:", error)
    return false
  }
}
