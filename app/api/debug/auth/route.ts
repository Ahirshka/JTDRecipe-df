import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  console.log("🔍 [AUTH-DEBUG] Starting authentication debug")

  try {
    // Get all cookies from the request - fix the cookies.entries issue
    const cookieHeader = request.headers.get("cookie") || ""
    const cookiePairs = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
    const allCookies: Record<string, string> = {}

    cookiePairs.forEach((pair) => {
      const [name, ...valueParts] = pair.split("=")
      if (name && valueParts.length > 0) {
        allCookies[name.trim()] = valueParts.join("=").trim()
      }
    })

    console.log("🔍 [AUTH-DEBUG] All cookies:", Object.keys(allCookies))

    // Try to find auth tokens using the request.cookies API
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
        rawCookieHeader: cookieHeader ? cookieHeader.substring(0, 100) + "..." : null,
      },
      headers: {
        userAgent: request.headers.get("user-agent"),
        referer: request.headers.get("referer"),
        origin: request.headers.get("origin"),
        host: request.headers.get("host"),
        authorization: request.headers.get("authorization") ? "Present" : "Not present",
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
                isExpired: payload.exp ? Date.now() / 1000 > payload.exp : false,
              }
            : null,
        }
      } catch (error) {
        debugInfo.tokenVerification = {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        }
      }
    } else {
      debugInfo.tokenVerification = {
        success: false,
        error: "No auth token found in any cookie",
        availableCookies: Object.keys(allCookies),
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
              is_verified: user.is_verified,
            }
          : null,
      }
    } catch (error) {
      debugInfo.serverAuthResult = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }
    }

    console.log("✅ [AUTH-DEBUG] Debug info collected:", {
      cookieCount: debugInfo.cookies.total,
      hasAuthToken: !!tokenToTest,
      tokenValid: debugInfo.tokenVerification?.success,
      userFound: debugInfo.serverAuthResult?.success,
    })

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("❌ [AUTH-DEBUG] Error during debug:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
