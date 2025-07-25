import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [AUTH-DEBUG] Starting authentication debug")

    // Get all cookies
    const cookies = request.cookies.getAll()
    console.log(
      "🔍 [AUTH-DEBUG] All cookies:",
      cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // Check for auth tokens
    const authToken = request.cookies.get("auth-token")?.value
    const authTokenAlt = request.cookies.get("auth_token")?.value
    const sessionToken = request.cookies.get("session")?.value
    const token = request.cookies.get("token")?.value

    const debugInfo = {
      cookies: {
        "auth-token": !!authToken,
        auth_token: !!authTokenAlt,
        session: !!sessionToken,
        token: !!token,
        total: cookies.length,
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

    // Test token verification
    const tokensToTest = [authToken, authTokenAlt, sessionToken, token].filter(Boolean)

    for (const testToken of tokensToTest) {
      if (!testToken) continue

      try {
        const decoded = verifyToken(testToken)
        debugInfo.verification[testToken.substring(0, 10)] = {
          valid: !!decoded,
          userId: decoded?.id,
          username: decoded?.username,
          role: decoded?.role,
        }
      } catch (error) {
        debugInfo.verification[testToken.substring(0, 10)] = {
          valid: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Test getCurrentUser
    try {
      const user = await getCurrentUser()
      debugInfo.user = user
        ? {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            is_verified: user.is_verified,
          }
        : null
    } catch (error) {
      debugInfo.user = {
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    console.log("✅ [AUTH-DEBUG] Debug info collected")

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [AUTH-DEBUG] Error:", error)
    return NextResponse.json(
      {
        error: "Debug failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
