import { getStackAuthConfig } from "@/lib/neon"
import { emailService } from "@/lib/email-service"
import { createEmailToken, verifyEmailToken } from "@/lib/email-tokens"

// Mock user storage (replace with actual Stack Auth integration)
const mockUsers = new Map([
  [
    "admin@jtdrecipe.com",
    {
      id: "1",
      email: "admin@jtdrecipe.com",
      username: "admin",
      password_hash: "mock_hash_admin",
      role: "admin",
      is_verified: true,
      created_at: new Date().toISOString(),
    },
  ],
  [
    "user@example.com",
    {
      id: "2",
      email: "user@example.com",
      username: "testuser",
      password_hash: "mock_hash_user",
      role: "user",
      is_verified: true,
      created_at: new Date().toISOString(),
    },
  ],
])

// Mock session storage
const mockSessions = new Map<string, { userId: string; email: string; expiresAt: Date }>()

export async function registerUser(email: string, username: string, password: string) {
  try {
    // Check Stack Auth configuration
    const stackConfig = getStackAuthConfig()
    if (!stackConfig.jwksUrl) {
      return {
        success: false,
        error: "Authentication service not configured",
      }
    }

    // Check if user already exists
    if (mockUsers.has(email)) {
      return {
        success: false,
        error: "User with this email already exists",
      }
    }

    // Create new user (mock implementation)
    const newUser = {
      id: Date.now().toString(),
      email,
      username,
      password_hash: `mock_hash_${Date.now()}`,
      role: "user",
      is_verified: false,
      created_at: new Date().toISOString(),
    }

    mockUsers.set(email, newUser)

    // Create email verification token
    const verificationToken = createEmailToken(email, "verification")

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(email, username, verificationToken)

    if (!emailSent) {
      console.warn("Failed to send verification email, but user was created")
    }

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
      message: "Registration successful. Please check your email for verification.",
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: "Registration failed",
    }
  }
}

export async function loginUser(email: string, password: string) {
  try {
    // Check Stack Auth configuration
    const stackConfig = getStackAuthConfig()
    if (!stackConfig.jwksUrl) {
      return {
        success: false,
        error: "Authentication service not configured",
      }
    }

    const user = mockUsers.get(email)

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password",
      }
    }

    if (!user.is_verified) {
      return {
        success: false,
        error: "Please verify your email before logging in",
      }
    }

    // In a real implementation, you would verify the password hash
    // For demo purposes, we'll accept any password

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    mockSessions.set(sessionToken, {
      userId: user.id,
      email: user.email,
      expiresAt,
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      sessionToken,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "Login failed",
    }
  }
}

export async function getCurrentUser(sessionToken?: string) {
  try {
    if (!sessionToken) {
      return null
    }

    const session = mockSessions.get(sessionToken)

    if (!session) {
      return null
    }

    if (new Date() > session.expiresAt) {
      mockSessions.delete(sessionToken)
      return null
    }

    const user = mockUsers.get(session.email)

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      is_verified: user.is_verified,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function logoutUser(sessionToken?: string) {
  try {
    if (!sessionToken) {
      return {
        success: true,
        message: "Logged out successfully",
      }
    }

    mockSessions.delete(sessionToken)

    return {
      success: true,
      message: "Logged out successfully",
    }
  } catch (error) {
    console.error("Logout error:", error)
    return {
      success: false,
      error: "Logout failed",
    }
  }
}

export async function verifyUserEmail(token: string) {
  try {
    const tokenData = verifyEmailToken(token, "verification")

    if (!tokenData) {
      return {
        success: false,
        error: "Invalid or expired verification token",
      }
    }

    const user = mockUsers.get(tokenData.email)

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    // Mark user as verified
    user.is_verified = true
    mockUsers.set(tokenData.email, user)

    return {
      success: true,
      message: "Email verified successfully",
    }
  } catch (error) {
    console.error("Email verification error:", error)
    return {
      success: false,
      error: "Email verification failed",
    }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    const user = mockUsers.get(email)

    if (!user) {
      // Don't reveal if user exists or not
      return {
        success: true,
        message: "If an account with this email exists, you will receive a password reset link.",
      }
    }

    // Create password reset token
    const resetToken = createEmailToken(email, "password_reset")

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(email, user.username, resetToken)

    return {
      success: true,
      message: "If an account with this email exists, you will receive a password reset link.",
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    return {
      success: false,
      error: "Failed to process password reset request",
    }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const tokenData = verifyEmailToken(token, "password_reset")

    if (!tokenData) {
      return {
        success: false,
        error: "Invalid or expired reset token",
      }
    }

    const user = mockUsers.get(tokenData.email)

    if (!user) {
      return {
        success: false,
        error: "User not found",
      }
    }

    // Update password (mock implementation)
    user.password_hash = `mock_hash_${Date.now()}`
    mockUsers.set(tokenData.email, user)

    return {
      success: true,
      message: "Password reset successfully",
    }
  } catch (error) {
    console.error("Password reset error:", error)
    return {
      success: false,
      error: "Password reset failed",
    }
  }
}

function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Clean up expired sessions every hour
setInterval(
  () => {
    const now = new Date()
    for (const [token, session] of mockSessions.entries()) {
      if (now > session.expiresAt) {
        mockSessions.delete(token)
      }
    }
  },
  60 * 60 * 1000,
)
