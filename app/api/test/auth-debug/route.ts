import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, isAdmin } from "@/lib/server-auth"
import { findUserById } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"
import { addLog } from "../server-logs/route"
import { sql } from "@/lib/neon"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    addLog("info", "[AUTH-DEBUG] Starting authentication debug")

    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")?.value
    const sessionToken = cookieStore.get("session-token")?.value

    // Get current user
    const currentUser = await getCurrentUser(request)

    // Check admin status
    const adminStatus = currentUser ? await isAdmin(currentUser.id) : false

    // Get all users count
    const usersResult = await sql`SELECT COUNT(*) as count FROM users`
    const userCount = usersResult[0]?.count || 0

    // Get sessions count
    const sessionsResult = await sql`SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > NOW()`
    const activeSessionsCount = sessionsResult[0]?.count || 0

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      cookies: {
        authToken: authToken ? "***PRESENT***" : null,
        sessionToken: sessionToken ? "***PRESENT***" : null,
      },
      headers: {},
      authentication: {
        hasToken: !!authToken,
        tokenValid: false,
        userFound: false,
        userActive: false,
      },
      currentUser: currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            role: currentUser.role,
            isVerified: currentUser.is_verified,
          }
        : null,
      isAdmin: adminStatus,
      database: {
        totalUsers: Number.parseInt(userCount),
        activeSessions: Number.parseInt(activeSessionsCount),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      },
    }

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
