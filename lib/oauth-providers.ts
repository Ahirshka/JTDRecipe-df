export const OAUTH_PROVIDERS = {
  google: {
    name: "Google",
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"}/oauth`,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scopes: ["openid", "email", "profile"],
  },
}

export function getOAuthUrl(provider: keyof typeof OAUTH_PROVIDERS, state?: string) {
  const config = OAUTH_PROVIDERS[provider]

  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state && { state }),
  })

  return `${config.authUrl}?${params.toString()}`
}

export async function exchangeOAuthCode(provider: keyof typeof OAUTH_PROVIDERS, code: string) {
  const config = OAUTH_PROVIDERS[provider]

  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  })

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to exchange code for tokens: ${error}`)
  }

  return response.json()
}

export async function getOAuthUserInfo(provider: keyof typeof OAUTH_PROVIDERS, accessToken: string) {
  const config = OAUTH_PROVIDERS[provider]

  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const response = await fetch(`${config.userInfoUrl}?access_token=${accessToken}`)

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get user info: ${error}`)
  }

  return response.json()
}
