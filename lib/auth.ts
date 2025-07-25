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

// JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

// Role hierarchy with numeric levels (higher number = more permissions)
export const ROLE_HIERARCHY = {
  user: 1,
  verified: 2,
  moderator: 3,
  admin: 4,
  owner: 5,
} as const

export type Role = keyof typeof ROLE_HIERARCHY

// Token payload interface
export interface TokenPayload {
  userId: number
  email: string
  role: string
  iat?: number
  exp?: number
}

// Check if user can moderate another user
export function canModerateUser(moderator: User, target: User): boolean {
  if (moderator.id === target.id) return false // Can't moderate yourself

  const moderatorLevel = ROLE_HIERARCHY[moderator.role as keyof typeof ROLE_HIERARCHY] || 0
  const targetLevel = ROLE_HIERARCHY[target.role as keyof typeof ROLE_HIERARCHY] || 0

  return moderatorLevel > targetLevel && moderatorLevel >= ROLE_HIERARCHY.moderator
}

// Check if user has permission based on role
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0
  return userLevel >= requiredLevel
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
    issuer: "jtd-recipe",
  })
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

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// Validate username
export function isValidUsername(username: string): boolean {
  // 3-30 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
  return usernameRegex.test(username)
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
  duration: number, // days
): Promise<boolean> {
  try {
    const suspensionExpires = new Date()
    suspensionExpires.setDate(suspensionExpires.getDate() + duration)

    const updated = await updateUser(userId, {
      status: "suspended",
      suspension_reason: reason,
      suspension_expires_at: suspensionExpires.toISOString(),
    })

    return updated !== null
  } catch (error) {
    console.error("Error suspending user:", error)
    return false
  }
}

// Unsuspend user
export async function unsuspendUser(userId: number): Promise<boolean> {
  try {
    const updated = await updateUser(userId, {
      status: "active",
      suspension_reason: null,
      suspension_expires_at: null,
    })

    return updated !== null
  } catch (error) {
    console.error("Error unsuspending user:", error)
    return false
  }
}

// Ban user permanently
export async function banUser(userId: number, reason: string): Promise<boolean> {
  try {
    const updated = await updateUser(userId, {
      status: "banned",
      suspension_reason: reason,
    })

    return updated !== null
  } catch (error) {
    console.error("Error banning user:", error)
    return false
  }
}

// Change user role
export async function changeUserRole(userId: number, newRole: string): Promise<boolean> {
  try {
    const updated = await updateUser(userId, {
      role: newRole,
    })

    return updated !== null
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
      is_profile_verified: true,
    })

    return updated !== null
  } catch (error) {
    console.error("Error verifying user:", error)
    return false
  }
}

// Warn user
export async function warnUser(userId: number, reason: string): Promise<boolean> {
  try {
    const user = await findUserById(userId)
    if (!user) return false

    const updated = await updateUser(userId, {
      warning_count: (user.warning_count || 0) + 1,
    })

    return updated !== null
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
      throw new Error("Password does not meet requirements")
    }

    if (!isValidUsername(userData.username)) {
      throw new Error("Invalid username")
    }

    // Check if user already exists
    const existingUser = await dbFindUserByEmail(userData.email)
    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password)

    // Create user
    const newUser = await createUser({
      username: userData.username,
      email: userData.email,
      password_hash: passwordHash,
      role: userData.role || "user",
    })

    return newUser
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
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    const user = await dbFindUserByEmail(email)
    if (!user) {
      return null
    }

    const isValidPassword = await verifyPassword(password, user.password_hash || "")
    if (!isValidPassword) {
      return null
    }

    if (user.status !== "active") {
      throw new Error("Account is not active")
    }

    const token = generateToken(user)

    // Update last login
    await updateUser(user.id, {
      last_login_at: new Date().toISOString(),
    })

    return { user, token }
  } catch (error) {
    console.error("Error logging in user:", error)
    return null
  }
}

// Logout user
export async function logoutUser(token: string): Promise<boolean> {
  try {
    // In a production app, you would add the token to a blacklist
    // For now, we'll just return true as the client will remove the token
    console.log("User logged out, token should be removed from client")
    return true
  } catch (error) {
    console.error("Error logging out user:", error)
    return false
  }
}

// Refresh token
export function refreshToken(oldToken: string): string | null {
  try {
    const decoded = verifyToken(oldToken)
    if (!decoded) return null

    // Create new token with fresh expiration
    const newPayload: TokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }

    return jwt.sign(newPayload, JWT_SECRET, {
      expiresIn: "7d",
      issuer: "jtd-recipe",
    })
  } catch (error) {
    console.error("Error refreshing token:", error)
    return null
  }
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

// Generate secure random token
export function generateSecureToken(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Cookie utilities
export function createSecureCookieOptions(maxAge: number = 7 * 24 * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  }
}
