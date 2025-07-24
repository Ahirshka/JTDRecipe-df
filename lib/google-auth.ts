interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  id_token?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

interface OAuthState {
  state: string
  codeVerifier: string
  createdAt: Date
}

// In-memory state storage (in production, use Redis or database)
const stateStore = new Map<string, OAuthState>()

export function generateOAuthState(): { state: string; codeVerifier: string } {
  const state = generateRandomString(32)
  const codeVerifier = generateRandomString(128)

  stateStore.set(state, {
    state,
    codeVerifier,
    createdAt: new Date(),
  })

  // Clean up old states
  cleanupExpiredStates()

  return { state, codeVerifier }
}

export function verifyOAuthState(state: string): { valid: boolean; codeVerifier?: string } {
  const stateData = stateStore.get(state)

  if (!stateData) {
    return { valid: false }
  }

  // Check if state is expired (5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  if (stateData.createdAt < fiveMinutesAgo) {
    stateStore.delete(state)
    return { valid: false }
  }

  // Remove state after use
  stateStore.delete(state)

  return {
    valid: true,
    codeVerifier: stateData.codeVerifier,
  }
}

export function getGoogleAuthUrl(): string {
  const { state } = generateOAuthState()
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"}/oauth`

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not set")
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: state,
    access_type: "offline",
    prompt: "consent",
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string, state: string): Promise<GoogleTokenResponse | null> {
  try {
    const stateVerification = verifyOAuthState(state)
    if (!stateVerification.valid) {
      console.error("Invalid OAuth state")
      return null
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"}/oauth`

    if (!clientId || !clientSecret) {
      console.error("Google OAuth credentials not configured")
      return null
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text())
      return null
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json()
    return tokenData
  } catch (error) {
    console.error("Error exchanging code for token:", error)
    return null
  }
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userResponse.ok) {
      console.error("Failed to get user info:", await userResponse.text())
      return null
    }

    const userData: GoogleUserInfo = await userResponse.json()
    return userData
  } catch (error) {
    console.error("Error getting user info:", error)
    return null
  }
}

function generateRandomString(length: number): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

function cleanupExpiredStates(): void {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  for (const [state, data] of stateStore.entries()) {
    if (data.createdAt < fiveMinutesAgo) {
      stateStore.delete(state)
    }
  }
}

// Clean up expired states every minute
setInterval(cleanupExpiredStates, 60 * 1000)
