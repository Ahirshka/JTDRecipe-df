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
      sessionToken,
      token,
    }

    console.log("🔍 [AUTH-DEBUG] Token debug:", tokenDebug)

    // Try to verify tokens
    const verificationResults: any = {}
    const tokens = [
      { name: "authToken", value: authToken },
      { name: "authTokenAlt", value: authTokenAlt },
      { name: "sessionToken", value: sessionToken },
      { name: "token", value: token },
    ]

    let currentUser = null

    for (const { name, value } of tokens) {
      if (value) {
        try {
          const decoded = verifyToken(value)
          const key = value.substring(0, 10)
          verificationResults[key] = {
            valid: !!decoded,
            userId: decoded?.id,
            username: decoded?.username,
            role: decoded?.role,
          }

          if (decoded && !currentUser) {
            // Try to get user from database
            try {
              const dbUser = await findUserById(decoded.id)
              if (dbUser) {
                currentUser = {
                  id: dbUser.id,
                  username: dbUser.username,
                  email: dbUser.email,
                  role: dbUser.role,
                  status: dbUser.status,
                  is_verified: dbUser.is_verified,
                }
                console.log("✅ [AUTH-DEBUG] Found user in database:", currentUser)
              }
            } catch (dbError) {
              console.error("❌ [AUTH-DEBUG] Database error:", dbError)
            }
          }
        } catch (error) {
          console.error(`❌ [AUTH-DEBUG] Error verifying ${name}:`, error)
          const key = value.substring(0, 10)
          verificationResults[key] = {
            valid: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }
    }

    console.log("🔍 [AUTH-DEBUG] Verification results:", verificationResults)

    // Environment check
    const environmentDebug = {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
    }

    console.log("🔍 [AUTH-DEBUG] Environment debug:", environmentDebug)

    const debugResponse = {
      success: true,
      debug: {
        cookies: cookieDebug,
        tokens: tokenDebug,
        verification: verificationResults,
        user: currentUser,
        environment: environmentDebug,
      },
      timestamp: new Date().toISOString(),
    }

    console.log("✅ [AUTH-DEBUG] Debug complete")

    return NextResponse.json(debugResponse)
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
