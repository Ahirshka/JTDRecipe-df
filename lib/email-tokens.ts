// In-memory token storage for demo purposes
// In production, you would use a database or Redis
interface TokenData {
  email: string
  type: "verification" | "password_reset"
  createdAt: Date
  expiresAt: Date
}

const tokenStore = new Map<string, TokenData>()

export function createEmailToken(email: string, type: "verification" | "password_reset"): string {
  const token = generateRandomToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + (type === "verification" ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000)) // 24h for verification, 1h for password reset

  tokenStore.set(token, {
    email,
    type,
    createdAt: now,
    expiresAt,
  })

  // Clean up expired tokens
  cleanupExpiredTokens()

  return token
}

export function verifyEmailToken(token: string, expectedType: "verification" | "password_reset"): TokenData | null {
  const tokenData = tokenStore.get(token)

  if (!tokenData) {
    return null
  }

  if (tokenData.type !== expectedType) {
    return null
  }

  if (new Date() > tokenData.expiresAt) {
    tokenStore.delete(token)
    return null
  }

  // Token is valid, remove it to prevent reuse
  tokenStore.delete(token)

  return tokenData
}

export function deleteEmailToken(token: string): boolean {
  return tokenStore.delete(token)
}

function generateRandomToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function cleanupExpiredTokens(): void {
  const now = new Date()
  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expiresAt) {
      tokenStore.delete(token)
    }
  }
}

// Email Token Service class for compatibility
export class EmailTokenService {
  async createEmailVerificationToken(userId: string): Promise<string> {
    // For demo purposes, we'll use userId as email
    return createEmailToken(userId, "verification")
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    return createEmailToken(userId, "password_reset")
  }

  async verifyToken(
    token: string,
    type: "email_verification" | "password_reset",
  ): Promise<{ valid: boolean; userId?: string; error?: string }> {
    const mappedType = type === "email_verification" ? "verification" : "password_reset"
    const tokenData = verifyEmailToken(token, mappedType)

    if (!tokenData) {
      return { valid: false, error: "Invalid or expired token" }
    }

    return { valid: true, userId: tokenData.email }
  }

  async markTokenAsUsed(token: string): Promise<void> {
    deleteEmailToken(token)
  }

  async cleanupExpiredTokens(): Promise<void> {
    cleanupExpiredTokens()
  }
}

// Export singleton instance
export const emailTokenService = new EmailTokenService()

// Clean up expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000)
