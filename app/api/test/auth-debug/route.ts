import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { findUserById } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [AUTH-DEBUG] Starting authentication debug")

    // Get all cookies from the request
    const requestCookies = request.cookies.getAll()
    console.log(
      "🔍 [AUTH-DEBUG] Request cookies:",
      requestCookies.map((c) => c.name),
    )

    // Check for authentication tokens
    const authToken = request.cookies.get("auth-token")?.value
    const authTokenAlt = request.cookies.get("auth_token")?.value
    const sessionToken = request.cookies.get("session")?.value
    const token = request.cookies.get("token")?.value

    console.log("🔍 [AUTH-DEBUG] Token availability:", {
      authToken: !!authToken,
      authTokenAlt: !!authTokenAlt,
      sessionToken: !!sessionToken,
      token: !!token,
    })

    const debug: any = {
      cookies: {
        "auth-token": !!authToken,
        auth_token: !!authTokenAlt,
        session: !!sessionToken,
        token: !!token,
        requestTotal: requestCookies.length,
        serverTotal: requestCookies.length,
      },
      tokens: {
        authToken: authToken ? authToken.substring(0, 20) + "..." : null,
        authTokenAlt: authTokenAlt ? authTokenAlt.substring(0, 20) + "..." : null,
        sessionToken: sessionToken ? sessionToken.substring(0, 20) + "..." : null,
        token: token ? token.substring(0, 20) + "..." : null,
      },
      verification: {},
      user: null,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET: !!process.env.JWT_SECRET,
        DATABASE_URL: !!process.env.DATABASE_URL,
      },
    }

    // Try to verify tokens
    const tokensToTry = [authToken, authTokenAlt, sessionToken, token].filter(Boolean)

    for (const tokenValue of tokensToTry) {
      if (!tokenValue) continue

      try {
        console.log("🔍 [AUTH-DEBUG] Verifying token:", tokenValue.substring(0, 10) + "...")
        const decoded = verifyToken(tokenValue)

        if (decoded) {
          console.log("✅ [AUTH-DEBUG] Token verified:", decoded)
          debug.verification[tokenValue.substring(0, 10)] = {
            valid: true,
            userId: decoded.id,
            username: decoded.username,
            role: decoded.role,
          }

          // Get user from database if we haven't already
          if (!debug.user) {
            try {
              const dbUser = await findUserById(decoded.id)
              if (dbUser) {
                console.log("✅ [AUTH-DEBUG] User found in database:", dbUser.username)
                debug.user = {
                  id: dbUser.id,
                  username: dbUser.username,
                  email: dbUser.email,
                  role: dbUser.role,
                  status: dbUser.status,
                  is_verified: dbUser.is_verified,
                }
              } else {
                console.log("❌ [AUTH-DEBUG] User not found in database")
              }
            } catch (dbError) {
              console.error("❌ [AUTH-DEBUG] Database error:", dbError)
              debug.user = { error: "Database error" }
            }
          }
        } else {
          console.log("❌ [AUTH-DEBUG] Token verification failed")
          debug.verification[tokenValue.substring(0, 10)] = {
            valid: false,
            error: "Token verification failed",
          }
        }
      } catch (verifyError) {
        console.error("❌ [AUTH-DEBUG] Token verification error:", verifyError)
        debug.verification[tokenValue.substring(0, 10)] = {
          valid: false,
          error: verifyError instanceof Error ? verifyError.message : "Unknown error",
        }
      }
    }

    console.log("✅ [AUTH-DEBUG] Debug complete")

    return NextResponse.json({
      success: true,
      debug,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [AUTH-DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Authentication debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
