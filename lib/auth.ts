import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { cookies } from "next/headers"
import {
  findUserById,
  findUserByEmail as findUserByEmailInDB,
  createUser as createUserInDB,
  createSession,
  deleteSession,
  getAllUsers,
  updateUserById,
  sql,
} from "./neon"
import type { User } from "./neon"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required")
}

const JWT_SECRET = process.env.JWT_SECRET

export interface TokenPayload {
  id: string
  username: string
  email: string
  role: string
  iat?: number
  exp?: number
}

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

export type UserRole = "user" | "moderator" | "admin" | "owner" | "verified"
export type UserStatus = "active" | "suspended" | "banned" | "pending"

export interface ModerationNote {
  id: string
  moderatorId: string
  moderatorName: string
  note: string
  action: ModerationAction
  createdAt: string
}

export type ModerationAction = "warning" | "suspension" | "ban" | "note" | "verification" | "role_change"

export interface UserRating {
  recipeId: string
  rating: number
  createdAt: string
}

// Define role hierarchy with explicit levels - REQUIRED EXPORT
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  verified: 2,
  moderator: 3,
  admin: 4,
  owner: 5,
} as const

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    console.log("✅ Password hashed successfully")
    return hashedPassword
  } catch (error) {
    console.error("❌ Error hashing password:", error)
    throw new Error("Failed to hash password")
  }
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword)
    console.log(`✅ Password verification: ${isValid ? "valid" : "invalid"}`)
    return isValid
  } catch (error) {
    console.error("❌ Error verifying password:", error)
    return false
  }
}

// JWT token utilities
export function generateToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "7d", // 7 days
      issuer: "jtd-recipe-app",
      audience: "jtd-recipe-users",
    })
    console.log("✅ JWT token generated successfully")
    return token
  } catch (error) {
    console.error("❌ Error generating JWT token:", error)
    throw new Error("Failed to generate token")
  }
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: "jtd-recipe-app",
      audience: "jtd-recipe-users",
    }) as TokenPayload

    console.log("✅ JWT token verified successfully")
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log("⚠️ JWT token expired")
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log("❌ Invalid JWT token")
    } else {
      console.error("❌ Error verifying JWT token:", error)
    }
    return null
  }
}

export function refreshToken(token: string): string | null {
  try {
    const decoded = verifyToken(token)
    if (!decoded) {
      return null
    }

    // Generate new token with same payload but fresh expiration
    const newToken = generateToken({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    })

    console.log("✅ JWT token refreshed successfully")
    return newToken
  } catch (error) {
    console.error("❌ Error refreshing JWT token:", error)
    return null
  }
}

// Find user by email - REQUIRED EXPORT
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await findUserByEmailInDB(email)
    if (!user) return null

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      is_profile_verified: user.is_profile_verified,
      avatar_url: user.avatar_url,
      bio: user.bio,
      location: user.location,
      website: user.website,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
    }
  } catch (error) {
    console.error("Error finding user by email:", error)
    return null
  }
}

// Login user - REQUIRED EXPORT
export async function loginUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
  try {
    console.log("🔍 Attempting login for:", email)

    const user = await findUserByEmailInDB(email)
    console.log("🔍 Found user:", user ? "Yes" : "No")

    if (!user) {
      console.log("❌ User not found")
      return { success: false, error: "Invalid email or password" }
    }

    console.log("🔍 User details:", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password_hash,
    })

    // Check if password is still plain text (for owner account migration)
    let isValidPassword = false

    if (user.password_hash === "Morton2121" && password === "Morton2121") {
      // Migrate plain text password to hashed
      console.log("🔄 Migrating plain text password to hash")
      const hashedPassword = await hashPassword("Morton2121")
      await updateUserById(user.id, { password_hash: hashedPassword })
      isValidPassword = true
    } else {
      // Check hashed password
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    }

    console.log("🔍 Password valid:", isValidPassword)

    if (!isValidPassword) {
      console.log("❌ Invalid password")
      return { success: false, error: "Invalid email or password" }
    }

    if (user.status !== "active") {
      console.log("❌ Account not active:", user.status)
      return { success: false, error: "Account is not active" }
    }

    // Update last login
    await updateUserById(user.id, { last_login_at: new Date().toISOString() })

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      is_profile_verified: user.is_profile_verified,
      avatar_url: user.avatar_url,
      bio: user.bio,
      location: user.location,
      website: user.website,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: new Date().toISOString(),
    }

    const token = generateToken({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    })
    console.log("✅ Generated token for user")

    // Create session in database
    try {
      await createSession(user.id, token)
      console.log("✅ Created session in database")
    } catch (sessionError) {
      console.error("⚠️ Session creation failed:", sessionError)
      // Continue anyway, token is still valid
    }

    console.log("✅ Login successful")
    return { success: true, user: authUser, token }
  } catch (error) {
    console.error("❌ Login error:", error)
    return { success: false, error: "Login failed. Please try again." }
  }
}

// Logout user - REQUIRED EXPORT
export async function logoutUser(token: string): Promise<boolean> {
  try {
    await deleteSession(token)
    return true
  } catch (error) {
    console.error("Logout error:", error)
    return false
  }
}

// Permission checking functions with proper error handling
export const hasPermission = (userRole: UserRole | string | undefined, requiredRole: UserRole | string): boolean => {
  // Handle undefined or null roles
  if (!userRole || !requiredRole) {
    return false
  }

  // Ensure roles are valid
  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner", "verified"]

  if (!validRoles.includes(userRole as UserRole) || !validRoles.includes(requiredRole as UserRole)) {
    return false
  }

  const userLevel = ROLE_HIERARCHY[userRole as UserRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole as UserRole] || 0

  return userLevel >= requiredLevel
}

export const canModerateUser = (
  moderatorRole: UserRole | string | undefined,
  targetRole: UserRole | string | undefined,
): boolean => {
  // Handle undefined roles
  if (!moderatorRole || !targetRole) {
    return false
  }

  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner", "verified"]

  if (!validRoles.includes(moderatorRole as UserRole) || !validRoles.includes(targetRole as UserRole)) {
    return false
  }

  const moderatorLevel = ROLE_HIERARCHY[moderatorRole as UserRole] || 0
  const targetLevel = ROLE_HIERARCHY[targetRole as UserRole] || 0

  return moderatorLevel > targetLevel
}

// Check if user has specific permission
export const hasSpecificPermission = (userRole: UserRole | string | undefined, permission: string): boolean => {
  if (!userRole) {
    return false
  }

  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner", "verified"]

  if (!validRoles.includes(userRole as UserRole)) {
    return false
  }

  const rolePermissions: Record<UserRole, string[]> = {
    user: ["view_recipes", "create_recipes", "rate_recipes", "favorite_recipes"],
    moderator: [
      "view_recipes",
      "create_recipes",
      "rate_recipes",
      "favorite_recipes",
      "moderate_recipes",
      "moderate_comments",
      "view_reports",
    ],
    admin: [
      "view_recipes",
      "create_recipes",
      "rate_recipes",
      "favorite_recipes",
      "moderate_recipes",
      "moderate_comments",
      "view_reports",
      "manage_users",
      "manage_categories",
      "view_analytics",
    ],
    owner: [
      "view_recipes",
      "create_recipes",
      "rate_recipes",
      "favorite_recipes",
      "moderate_recipes",
      "moderate_comments",
      "view_reports",
      "manage_users",
      "manage_categories",
      "view_analytics",
      "manage_system",
      "manage_admins",
    ],
    verified: ["view_recipes", "create_recipes", "rate_recipes", "favorite_recipes"],
  }

  const permissions = rolePermissions[userRole as UserRole] || []
  return permissions.includes(permission)
}

// Get user role level
export const getRoleLevel = (role: UserRole | string | undefined): number => {
  if (!role) {
    return 0
  }

  return ROLE_HIERARCHY[role as UserRole] || 0
}

// Check if role is valid
export const isValidRole = (role: string | undefined): role is UserRole => {
  if (!role) {
    return false
  }

  const validRoles: UserRole[] = ["user", "moderator", "admin", "owner", "verified"]
  return validRoles.includes(role as UserRole)
}

// Get default role
export const getDefaultRole = (): UserRole => {
  return "user"
}

// Database interaction functions
export const saveUser = async (userData: {
  username: string
  email: string
  password?: string
  role?: string
}): Promise<User> => {
  try {
    const hashedPassword = userData.password ? await hashPassword(userData.password) : undefined

    const dbUser = await createUserInDB({
      username: userData.username,
      email: userData.email,
      password_hash: hashedPassword || "",
      role: userData.role || "user",
      is_verified: false,
      is_profile_verified: false,
    })

    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      password_hash: dbUser.password_hash,
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
    console.error("Error saving user:", error)
    throw error
  }
}

export const getAllUsersForModeration = async (): Promise<User[]> => {
  try {
    const dbUsers = await getAllUsers()

    return dbUsers
      .map((dbUser) => ({
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email,
        password_hash: dbUser.password_hash,
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
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (error) {
    console.error("Error getting all users for moderation:", error)
    return []
  }
}

export async function suspendUser(userId: string, reason: string, durationDays: number): Promise<boolean> {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    await updateUserById(Number.parseInt(userId), {
      status: "suspended",
      suspension_reason: reason,
      suspension_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error suspending user:", error)
    return false
  }
}

export async function unsuspendUser(userId: string): Promise<boolean> {
  try {
    await updateUserById(Number.parseInt(userId), {
      status: "active",
      suspension_reason: null,
      suspension_expires_at: null,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error unsuspending user:", error)
    return false
  }
}

export async function banUser(userId: string, reason: string): Promise<boolean> {
  try {
    await updateUserById(Number.parseInt(userId), {
      status: "banned",
      suspension_reason: reason,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error banning user:", error)
    return false
  }
}

export async function changeUserRole(userId: string, newRole: UserRole): Promise<boolean> {
  try {
    await updateUserById(Number.parseInt(userId), {
      role: newRole,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error changing user role:", error)
    return false
  }
}

export async function verifyUser(userId: string): Promise<boolean> {
  try {
    await updateUserById(Number.parseInt(userId), {
      is_verified: true,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error verifying user:", error)
    return false
  }
}

export async function warnUser(userId: string, reason: string): Promise<boolean> {
  try {
    const user = await findUserById(Number.parseInt(userId))
    if (!user) return false

    const currentWarnings = user.warning_count || 0

    await updateUserById(Number.parseInt(userId), {
      warning_count: currentWarnings + 1,
      updated_at: new Date().toISOString(),
    })

    return true
  } catch (error) {
    console.error("Error warning user:", error)
    return false
  }
}

// Random token generation for email verification, password reset, etc.
export function generateRandomToken(length = 32): string {
  try {
    const token = crypto.randomBytes(length).toString("hex")
    console.log("✅ Random token generated successfully")
    return token
  } catch (error) {
    console.error("❌ Error generating random token:", error)
    throw new Error("Failed to generate random token")
  }
}

// Input validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(email)
  console.log(`✅ Email validation: ${isValid ? "valid" : "invalid"}`)
  return isValid
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  const isValid = errors.length === 0
  console.log(`✅ Password validation: ${isValid ? "valid" : "invalid"}`)

  if (!isValid) {
    console.log("❌ Password validation errors:", errors)
  }

  return { isValid, errors }
}

export function validateUsername(username: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long")
  }

  if (username.length > 30) {
    errors.push("Username must be no more than 30 characters long")
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, underscores, and hyphens")
  }

  if (/^[_-]/.test(username) || /[_-]$/.test(username)) {
    errors.push("Username cannot start or end with underscore or hyphen")
  }

  const isValid = errors.length === 0
  console.log(`✅ Username validation: ${isValid ? "valid" : "invalid"}`)

  if (!isValid) {
    console.log("❌ Username validation errors:", errors)
  }

  return { isValid, errors }
}

// Security utilities
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()

  console.log("✅ Input sanitized")
  return sanitized
}

export function generateSecureId(): string {
  try {
    const timestamp = Date.now().toString(36)
    const randomPart = crypto.randomBytes(8).toString("hex")
    const secureId = `${timestamp}_${randomPart}`
    console.log("✅ Secure ID generated")
    return secureId
  } catch (error) {
    console.error("❌ Error generating secure ID:", error)
    throw new Error("Failed to generate secure ID")
  }
}

// Rate limiting utilities (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs: number = 15 * 60 * 1000, // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit_${identifier}`

  let record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, record)

    console.log(`✅ Rate limit check: allowed (${record.count}/${maxRequests})`)
    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    }
  }

  record.count++
  rateLimitStore.set(key, record)

  const allowed = record.count <= maxRequests
  const remaining = Math.max(0, maxRequests - record.count)

  console.log(`✅ Rate limit check: ${allowed ? "allowed" : "blocked"} (${record.count}/${maxRequests})`)

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
  }
}

// Clean up expired rate limit records periodically
setInterval(
  () => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  },
  5 * 60 * 1000,
) // Clean up every 5 minutes

// Cookie management utilities
export async function setAuthCookie(user: User) {
  const token = generateToken({
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  })
  const cookieStore = cookies()

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  return token
}

export async function clearAuthCookie() {
  const cookieStore = cookies()
  cookieStore.delete("auth-token")
  cookieStore.delete("session-token")
}

// Helper functions for database operations
export async function createUser(username: string, email: string, password: string): Promise<User> {
  const hashedPassword = await hashPassword(password)
  const userId = crypto.randomUUID()

  const result = await sql`
    INSERT INTO users (id, username, email, password_hash, role, is_verified, created_at, updated_at)
    VALUES (${userId}, ${username}, ${email}, ${hashedPassword}, 'user', false, NOW(), NOW())
    RETURNING id, username, email, role, is_verified, created_at, updated_at
  `

  return result[0] as User
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const result = await sql`
    SELECT id, username, email, password_hash, role, is_verified, created_at, updated_at
    FROM users
    WHERE email = ${email}
  `

  if (result.length === 0) {
    return null
  }

  const user = result[0]
  const isValidPassword = await verifyPassword(password, user.password_hash)

  if (!isValidPassword) {
    return null
  }

  // Return user without password hash
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword as User
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await sql`
    SELECT id, username, email, role, is_verified, created_at, updated_at
    FROM users
    WHERE id = ${userId}
  `

  return result.length > 0 ? (result[0] as User) : null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT id, username, email, role, is_verified, created_at, updated_at
    FROM users
    WHERE email = ${email}
  `

  return result.length > 0 ? (result[0] as User) : null
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT user_id, expires_at FROM email_tokens
      WHERE token = ${token} AND token_type = 'email_verification'
    `

    if (result.length === 0) {
      return false
    }

    const tokenData = result[0]

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return false
    }

    // Mark user as verified
    await sql`
      UPDATE users SET is_verified = true, updated_at = NOW()
      WHERE id = ${tokenData.user_id}
    `

    // Delete the used token
    await sql`
      DELETE FROM email_tokens WHERE token = ${token}
    `

    return true
  } catch (error) {
    console.error("Error verifying email token:", error)
    return false
  }
}

// Check if user is authenticated
export function isAuthenticated(user: User | null): boolean {
  return user !== null && user.status === "active"
}

// Check if user is admin
export function isAdmin(user: User | null): boolean {
  return user !== null && hasPermission(user.role, "admin")
}

// Check if user is moderator or higher
export function isModerator(user: User | null): boolean {
  return user !== null && hasPermission(user.role, "moderator")
}

// Get user display name
export function getUserDisplayName(user: User | null): string {
  if (!user) return "Guest"
  return user.username || user.email || "User"
}

// Get user initials for avatar
export function getUserInitials(user: User | null): string {
  if (!user || !user.username) return "U"

  const names = user.username.split(" ")
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }

  return user.username.charAt(0).toUpperCase()
}

// Role display functions
export function getRoleDisplayName(role: UserRole | string | undefined): string {
  if (!role || !isValidRole(role)) {
    return "User"
  }

  const roleNames: Record<UserRole, string> = {
    user: "User",
    moderator: "Moderator",
    admin: "Administrator",
    owner: "Owner",
    verified: "Verified User",
  }

  return roleNames[role as UserRole] || "User"
}

export function getRoleBadgeColor(role: UserRole | string | undefined): string {
  if (!role || !isValidRole(role)) {
    return "bg-gray-100 text-gray-800"
  }

  const roleColors: Record<UserRole, string> = {
    user: "bg-gray-100 text-gray-800",
    moderator: "bg-blue-100 text-blue-800",
    admin: "bg-red-100 text-red-800",
    owner: "bg-purple-100 text-purple-800",
    verified: "bg-green-100 text-green-800",
  }

  return roleColors[role as UserRole] || "bg-gray-100 text-gray-800"
}

// Update user login time
export async function updateUserLoginTime(userId: number): Promise<void> {
  try {
    await updateUserById(userId, {
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating user login time:", error)
  }
}

// Clear rate limit
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(`rate_limit_${identifier}`)
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    if (!decoded || !decoded.exp) return true

    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    console.error("❌ Error checking token expiration:", error)
    return true
  }
}

// Get token expiration date
export function getTokenExpirationDate(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload
    if (!decoded || !decoded.exp) return null

    return new Date(decoded.exp * 1000)
  } catch (error) {
    console.error("❌ Error getting token expiration date:", error)
    return null
  }
}
