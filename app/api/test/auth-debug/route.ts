import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { findUserById, findUserByEmail } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { addLog } from "../server-logs/route"

export async function GET(request: NextRequest) {
  try {
    addLog("info", "[AUTH-DEBUG] Starting authentication debug")

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      cookies: {},
      headers: {},
      authentication: {
        hasToken: false,
        tokenValid: false,
        userFound: false,
        userActive: false,
      },
      user: null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      },
    }

    // Check cookies
    const cookieHeader = request.headers.get("cookie")
    debugInfo.cookies.raw = cookieHeader

    const authToken =
      request.cookies.get("auth-token")?.value ||
      request.cookies.get("auth_token")?.value ||
      request.cookies.get("authToken")?.value

    debugInfo.cookies.authToken = authToken ? "***PRESENT***" : null
    debugInfo.authentication.hasToken = !!authToken

    addLog("info", "[AUTH-DEBUG] Cookie analysis", {
      hasAuthToken: !!authToken,
      cookieNames: request.cookies.getAll().map((c) => c.name),
    })

    // Check headers
    debugInfo.headers.authorization = request.headers.get("authorization") ? "***PRESENT***" : null
    debugInfo.headers.userAgent = request.headers.get("user-agent")

    if (authToken) {
      try {
        // Verify token
        const decoded = verifyToken(authToken)
        debugInfo.authentication.tokenValid = !!decoded
        debugInfo.authentication.decodedPayload = decoded
          ? {
              id: decoded.id,
              username: decoded.username,
              role: decoded.role,
              iat: decoded.iat,
              exp: decoded.exp,
            }
          : null

        addLog("info", "[AUTH-DEBUG] Token verification", {
          valid: !!decoded,
          userId: decoded?.id,
        })

        if (decoded) {
          // Try to find user in database
          const user = await findUserById(decoded.id)
          debugInfo.authentication.userFound = !!user
          debugInfo.authentication.userActive = user?.status === "active"

          if (user) {
            debugInfo.user = {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status,
              is_verified: user.is_verified,
              created_at: user.created_at,
              last_login_at: user.last_login_at,
            }

            addLog("info", "[AUTH-DEBUG] User found in database", {
              userId: user.id,
              username: user.username,
              status: user.status,
            })
          } else {
            addLog("error", "[AUTH-DEBUG] User not found in database", {
              userId: decoded.id,
            })
          }
        }
      } catch (tokenError) {
        debugInfo.authentication.tokenError = tokenError instanceof Error ? tokenError.message : "Unknown error"
        addLog("error", "[AUTH-DEBUG] Token verification failed", { error: tokenError })
      }
    }

    // Test getCurrentUserFromRequest function
    try {
      const currentUser = await getCurrentUserFromRequest(request)
      debugInfo.authentication.getCurrentUserResult = currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            role: currentUser.role,
          }
        : null

      addLog("info", "[AUTH-DEBUG] getCurrentUserFromRequest result", {
        success: !!currentUser,
        userId: currentUser?.id,
      })
    } catch (getCurrentUserError) {
      debugInfo.authentication.getCurrentUserError =
        getCurrentUserError instanceof Error ? getCurrentUserError.message : "Unknown error"
      addLog("error", "[AUTH-DEBUG] getCurrentUserFromRequest failed", { error: getCurrentUserError })
    }

    // Test database connectivity
    try {
      const testUser = await findUserByEmail("owner@jtdrecipe.com")
      debugInfo.database = {
        connected: true,
        ownerAccountExists: !!testUser,
        ownerAccountDetails: testUser
          ? {
              id: testUser.id,
              username: testUser.username,
              role: testUser.role,
              status: testUser.status,
            }
          : null,
      }

      addLog("info", "[AUTH-DEBUG] Database connectivity test", {
        connected: true,
        ownerExists: !!testUser,
      })
    } catch (dbError) {
      debugInfo.database = {
        connected: false,
        error: dbError instanceof Error ? dbError.message : "Unknown error",
      }
      addLog("error", "[AUTH-DEBUG] Database connectivity failed", { error: dbError })
    }

    addLog("info", "[AUTH-DEBUG] Debug completed", {
      hasToken: debugInfo.authentication.hasToken,
      tokenValid: debugInfo.authentication.tokenValid,
      userFound: debugInfo.authentication.userFound,
    })

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      summary: {
        authenticated:
          debugInfo.authentication.hasToken &&
          debugInfo.authentication.tokenValid &&
          debugInfo.authentication.userFound &&
          debugInfo.authentication.userActive,
        issues: [
          !debugInfo.authentication.hasToken && "No auth token found",
          debugInfo.authentication.hasToken && !debugInfo.authentication.tokenValid && "Invalid token",
          debugInfo.authentication.tokenValid && !debugInfo.authentication.userFound && "User not found in database",
          debugInfo.authentication.userFound && !debugInfo.authentication.userActive && "User account not active",
        ].filter(Boolean),
      },
    })
  } catch (error) {
    addLog("error", "[AUTH-DEBUG] Debug process failed", { error })
    console.error("❌ [AUTH-DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug process failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    addLog("info", "[AUTH-DEBUG] Manual token test requested")

    const body = await request.json()
    const { token } = body

    if (!token) {
      addLog("error", "[AUTH-DEBUG] No token provided for manual test")
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const testResult: any = {
      token: "***PROVIDED***",
      valid: false,
      decoded: null,
      user: null,
      error: null,
    }

    try {
      const decoded = verifyToken(token)
      testResult.valid = !!decoded
      testResult.decoded = decoded

      if (decoded) {
        const user = await findUserById(decoded.id)
        testResult.user = user
          ? {
              id: user.id,
              username: user.username,
              role: user.role,
              status: user.status,
            }
          : null
      }

      addLog("info", "[AUTH-DEBUG] Manual token test completed", {
        valid: testResult.valid,
        userFound: !!testResult.user,
      })
    } catch (error) {
      testResult.error = error instanceof Error ? error.message : "Unknown error"
      addLog("error", "[AUTH-DEBUG] Manual token test failed", { error })
    }

    return NextResponse.json({
      success: true,
      test: testResult,
    })
  } catch (error) {
    addLog("error", "[AUTH-DEBUG] Manual token test process failed", { error })
    console.error("❌ [AUTH-DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Manual token test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
