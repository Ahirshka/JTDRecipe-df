import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import crypto from "crypto"

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

// Role and permission utilities
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy: Record<string, number> = {
    user: 1,
    verified: 2,
    moderator: 3,
    admin: 4,
    owner: 5,
  }

  const userLevel = roleHierarchy[userRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0

  const hasAccess = userLevel >= requiredLevel
  console.log(`✅ Permission check: ${hasAccess ? "granted" : "denied"} (${userRole} -> ${requiredRole})`)

  return hasAccess
}

export function isValidRole(role: string): boolean {
  const validRoles = ["user", "verified", "moderator", "admin", "owner"]
  const isValid = validRoles.includes(role)
  console.log(`✅ Role validation: ${isValid ? "valid" : "invalid"} (${role})`)
  return isValid
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
