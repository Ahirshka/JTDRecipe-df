import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  console.log("🔍 [AUTH-DEBUG] Starting authentication debug")

  try {
    // Get all cookies from the request
    const allCookies = Object.fromEntries(
      Array.from(request.cookies.entries()).map(([name, cookie]) => [name, cookie.value]),
    )

    console.log("🔍 [AUTH-DEBUG] All cookies:", Object.keys(allCookies))

    // Try to find auth tokens
    const authToken = request.cookies.get("auth-token")?.value
    const authSession = request.cookies.get("auth_session")?.value
    const session = request.cookies.get("session")?.value

    const debugInfo = {
      success: true,
      timestamp: new Date().toISOString(),
      cookies: {
        total: Object.keys(allCookies).length,
        names: Object.keys(allCookies),
        authToken: authToken ? `${authToken.substring(0, 10)}...` : null,
        authSession: authSession ? `${authSession.substring(0, 10)}...` : null,
        session: session ? `${session.substring(0, 10)}...` : null,
      },
      headers: {
        userAgent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
        origin: request.headers.get("origin"),
        host: request.headers.get("host"),
      },
      tokenVerification: null,
      userLookup: null,
      serverAuthResult: null,
    }

    // Test token verification if we have a token
    const tokenToTest = authToken || authSession || session
    if (tokenToTest) {
      try {
        const payload = verifyToken(tokenToTest)
        debugInfo.tokenVerification = {
          success: !!payload,
          payload: payload
            ? {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                exp: payload.exp,
                iat: payload.iat,
              }
            : null,
        }
      } catch (error) {
        debugInfo.tokenVerification = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    }

    // Test server auth function
    try {
      const user = await getCurrentUserFromRequest(request)
      debugInfo.serverAuthResult = {
        success: !!user,
        user: user
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status,
            }
          : null,
      }
    } catch (error) {
      debugInfo.serverAuthResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }

    console.log("✅ [AUTH-DEBUG] Debug info collected:", debugInfo)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("❌ [AUTH-DEBUG] Error during debug:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
