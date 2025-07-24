import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import {
  findUserById,
  findUserByEmail,
  createUser,
  updateUser,
  createSession,
  findSessionByToken,
  deleteSession,
} from "./neon"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

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

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  user: 1,
  moderator: 2,
  admin: 3,
  owner: 4,
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// Login user
export async function loginUser(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string } | null> {
  try {
    const user = await findUserByEmail(credentials.email)

    if (!user) {
      console.log("User not found:", credentials.email)
      return null
    }

    // For the owner account, check plain text password first, then hash it
    if (user.email === "aaronhirshka@gmail.com" && user.password_hash === "Morton2121") {
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash("Morton2121", 12)
      await updateUser(user.id, { password_hash: hashedPassword })
      user.password_hash = hashedPassword
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash)

    if (!isValidPassword) {
      console.log("Invalid password for user:", credentials.email)
      return null
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
      last_login_at: user.last_login_at,
    }

    const token = generateToken(authUser)

    // Create session in database
    await createSession(user.id, token)

    return { user: authUser, token }
  } catch (error) {
    console.error("Login error:", error)
    return null
  }
}

// Register user
export async function registerUser(data: RegisterData): Promise<{ user: AuthUser; token: string } | null> {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(data.email)
    if (existingUser) {
      throw new Error("User already exists")
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 12)

    // Create user
    const newUser = await createUser({
      username: data.username,
      email: data.email,
      password_hash,
      role: "user",
      is_verified: false,
      is_profile_verified: false,
    })

    const authUser: AuthUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      is_verified: newUser.is_verified,
      is_profile_verified: newUser.is_profile_verified,
      avatar_url: newUser.avatar_url,
      bio: newUser.bio,
      location: newUser.location,
      website: newUser.website,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      last_login_at: newUser.last_login_at,
    }

    const token = generateToken(authUser)

    // Create session in database
    await createSession(newUser.id, token)

    return { user: authUser, token }
  } catch (error) {
    console.error("Registration error:", error)
    return null
  }
}

// Get user from token
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = verifyToken(token)
    if (!decoded) return null

    // Check if session exists in database
    const session = await findSessionByToken(token)
    if (!session) return null

    const user = await findUserById(decoded.id)
    if (!user) return null

    return {
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
      last_login_at: user.last_login_at,
    }
  } catch (error) {
    console.error("Get user from token error:", error)
    return null
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

// Check if user has permission
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0
  return userLevel >= requiredLevel
}

// Check if user is admin or owner
export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin" || user.role === "owner"
}

// Check if user is owner
export function isOwner(user: AuthUser): boolean {
  return user.role === "owner"
}

// Check if user can moderate another user
export function canModerateUser(moderator: AuthUser, target: AuthUser): boolean {
  const moderatorLevel = ROLE_HIERARCHY[moderator.role as keyof typeof ROLE_HIERARCHY] || 0
  const targetLevel = ROLE_HIERARCHY[target.role as keyof typeof ROLE_HIERARCHY] || 0
  return moderatorLevel > targetLevel
}

// Get all users for moderation
export async function getAllUsersForModeration(): Promise<AuthUser[]> {
  try {
    const { getAllUsers } = await import("./neon")
    const users = await getAllUsers()

    return users.map((user) => ({
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
      last_login_at: user.last_login_at,
    }))
  } catch (error) {
    console.error("Error getting users for moderation:", error)
    return []
  }
}

// Suspend user
export async function suspendUser(userId: number, reason: string, duration?: string): Promise<boolean> {
  try {
    const { updateUserById } = await import("./neon")
    const suspensionExpiresAt = duration
      ? new Date(Date.now() + Number.parseInt(duration) * 24 * 60 * 60 * 1000).toISOString()
      : null

    await updateUserById(userId, {
      status: "suspended",
      suspension_reason: reason,
      suspension_expires_at: suspensionExpiresAt,
    })

    return true
  } catch (error) {
    console.error("Error suspending user:", error)
    return false
  }
}

// Unsuspend user
export async function unsuspendUser(userId: number): Promise<boolean> {
  try {
    const { updateUserById } = await import("./neon")

    await updateUserById(userId, {
      status: "active",
      suspension_reason: null,
      suspension_expires_at: null,
    })

    return true
  } catch (error) {
    console.error("Error unsuspending user:", error)
    return false
  }
}

// Ban user
export async function banUser(userId: number, reason: string): Promise<boolean> {
  try {
    const { updateUserById } = await import("./neon")

    await updateUserById(userId, {
      status: "banned",
      suspension_reason: reason,
    })

    return true
  } catch (error) {
    console.error("Error banning user:", error)
    return false
  }
}

// Change user role
export async function changeUserRole(userId: number, newRole: string): Promise<boolean> {
  try {
    const { updateUserById } = await import("./neon")

    await updateUserById(userId, {
      role: newRole,
    })

    return true
  } catch (error) {
    console.error("Error changing user role:", error)
    return false
  }
}

// Verify user
export async function verifyUser(userId: number): Promise<boolean> {
  try {
    const { updateUserById } = await import("./neon")

    await updateUserById(userId, {
      is_verified: true,
      is_profile_verified: true,
    })

    return true
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

    const { updateUserById } = await import("./neon")
    const newWarningCount = (user.warning_count || 0) + 1

    await updateUserById(userId, {
      warning_count: newWarningCount,
    })

    return true
  } catch (error) {
    console.error("Error warning user:", error)
    return false
  }
}

// Save user (create new user)
export async function saveUser(userData: RegisterData): Promise<AuthUser | null> {
  try {
    const password_hash = await bcrypt.hash(userData.password, 12)

    const newUser = await createUser({
      username: userData.username,
      email: userData.email,
      password_hash,
      role: "user",
      is_verified: false,
      is_profile_verified: false,
    })

    return {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      is_verified: newUser.is_verified,
      is_profile_verified: newUser.is_profile_verified,
      avatar_url: newUser.avatar_url,
      bio: newUser.bio,
      location: newUser.location,
      website: newUser.website,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      last_login_at: newUser.last_login_at,
    }
  } catch (error) {
    console.error("Error saving user:", error)
    return null
  }
}

// Export findUserByEmail for compatibility
export { findUserByEmail }
