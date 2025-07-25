import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { findUserById } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [AUTH-DEBUG] Starting authentication debug")

    // Get all cookies from the request
    const allCookies = request.cookies.getAll()
    console.log(
      "🍪 [AUTH-DEBUG] All cookies:",
      allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // Check for auth tokens
    const authToken = request.cookies.get("auth-token")?.value
    const authTokenAlt = request.cookies.get("auth_token")?.value
    const sessionToken = request.cookies.get("session")?.value
    const token = request.cookies.get("token")?.value

    const cookieDebug = {
      "auth-token": !!authToken,
      auth_token: !!authTokenAlt,
      session: !!sessionToken,
      token: !!token,
      requestTotal: allCookies.length,
      serverTotal: allCookies.length,
    }

    console.log("🔍 [AUTH-DEBUG] Cookie debug:", cookieDebug)

    const tokenDebug = {
      authToken: authToken ? authToken.substring(0, 20) + "..." : null,
      authTokenAlt: authTokenAlt ? authTokenAlt.substring(0, 20) + "..." : null,
      sessionToken: sessionToken ? sessionToken.substring(0, 20) + "..." : null,
      token: token ? token.substring(0, 20) + "..." : null,
    }

    console.log("🔍 [AUTH-DEBUG] Token debug:", tokenDebug)

    // Try to verify tokens
    const verificationResults: any = {}
    const primaryToken = authToken || authTokenAlt

    if (primaryToken) {
      try {
        const decoded = verifyToken(primaryToken)
        const tokenKey = primaryToken.substring(0, 10)
        verificationResults[tokenKey] = {
          valid: !!decoded,
          userId: decoded?.id,
          username: decoded?.username,
          role: decoded?.role,
        }
        console.log("✅ [AUTH-DEBUG] Token verification:", verificationResults[tokenKey])
      } catch (error) {
        console.error("❌ [AUTH-DEBUG] Token verification error:", error)
        verificationResults.error = error instanceof Error ? error.message : "Unknown error"
      }
    }

    // Try to get user from database
    let user = null
    if (primaryToken) {
      try {
        const decoded = verifyToken(primaryToken)
        if (decoded) {
          user = await findUserById(decoded.id)
          console.log("✅ [AUTH-DEBUG] User found:", user ? user.username : "Not found")
        }
      } catch (error) {
        console.error("❌ [AUTH-DEBUG] Error getting user:", error)
      }
    }

    // Environment check
    const envDebug = {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
    }

    console.log("🔍 [AUTH-DEBUG] Environment debug:", envDebug)

    return NextResponse.json({
      success: true,
      debug: {
        cookies: cookieDebug,
        tokens: tokenDebug,
        verification: verificationResults,
        user: user
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status,
              is_verified: user.is_verified,
            }
          : null,
        environment: envDebug,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [AUTH-DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Authentication debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
