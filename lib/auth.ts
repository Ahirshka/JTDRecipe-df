import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import {
  findUserById,
  findUserByEmail as findUserByEmailInDB,
  createUser,
  updateUser,
  createSession,
  deleteSession,
  getAllUsers,
  updateUserById,
} from "./neon"
import type { User } from "@/lib/neon"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

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

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      userId: user.id, // Include both for compatibility
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

// Verify JWT token - REQUIRED EXPORT
export function verifyToken(
  token: string,
): { id: number; userId: number; username: string; email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id || decoded.userId,
      userId: decoded.userId || decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    console.error("Token verification failed:", error)
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

// Login user
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
      const hashedPassword = await bcrypt.hash("Morton2121", 12)
      await updateUser(user.id, { password_hash: hashedPassword })
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
    await updateUser(user.id, { last_login_at: new Date().toISOString() })

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

    const token = generateToken(authUser)
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

// Logout user
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

  const roleHierarchy = {
    owner: 5,
    admin: 4,
    moderator: 3,
    verified: 2,
    user: 1,
  }

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

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

  const roleHierarchy = {
    owner: 5,
    admin: 4,
    moderator: 3,
    verified: 2,
    user: 1,
  }

  const moderatorLevel = roleHierarchy[moderatorRole as keyof typeof roleHierarchy] || 0
  const targetLevel = roleHierarchy[targetRole as keyof typeof roleHierarchy] || 0

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

  const roleHierarchy = {
    owner: 5,
    admin: 4,
    moderator: 3,
    verified: 2,
    user: 1,
  }

  return roleHierarchy[role as keyof typeof roleHierarchy] || 0
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
export const saveUser = async (
  userData: Omit<
    User,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "favorites"
    | "ratings"
    | "myRecipes"
    | "isVerified"
    | "isSuspended"
    | "warningCount"
  >,
): Promise<User> => {
  try {
    const hashedPassword = userData.password ? await hashPassword(userData.password) : undefined

    const dbUser = await createUser({
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

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Generate secure token
export function generateSecureToken(): string {
  return jwt.sign({ random: Math.random(), timestamp: Date.now() }, JWT_SECRET, { expiresIn: "1h" })
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

// Rate limiting helper
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

export function checkRateLimit(identifier: string, maxAttempts = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const attempts = loginAttempts.get(identifier)

  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }

  if (now - attempts.lastAttempt > windowMs) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }

  if (attempts.count >= maxAttempts) {
    return false
  }

  attempts.count++
  attempts.lastAttempt = now
  return true
}

// Clear rate limit
export function clearRateLimit(identifier: string): void {
  loginAttempts.delete(identifier)
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

// Update user login time - REQUIRED EXPORT
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

// Define role hierarchy with explicit levels - REQUIRED EXPORT
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  verified: 2,
  moderator: 3,
  admin: 4,
  owner: 5,
} as const
