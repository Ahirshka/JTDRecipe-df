import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  console.log("🔍 [DEBUG-AUTH] Starting authentication debug")
  console.log("🔍 [DEBUG-AUTH] Request URL:", request.url)

  try {
    // Step 1: Check all cookies
    console.log("🔍 [DEBUG-AUTH] Step 1: Checking cookies...")
    const cookieNames = ["auth-token", "auth_token", "auth_session", "session", "session_token"]
    const cookieData: any = {
      total: 0,
      names: [],
      authToken: null,
      allCookies: {},
    }

    // Get all cookies from request
    const allCookies = Array.from(request.cookies.entries())
    cookieData.total = allCookies.length
    cookieData.allCookies = Object.fromEntries(allCookies.map(([name, cookie]) => [name, cookie.value]))

    console.log(
      "🍪 [DEBUG-AUTH] All cookies found:",
      allCookies.map(([name]) => name),
    )

    // Check for auth tokens
    for (const cookieName of cookieNames) {
      const cookieValue = request.cookies.get(cookieName)?.value
      if (cookieValue) {
        cookieData.names.push(cookieName)
        if (!cookieData.authToken) {
          cookieData.authToken = cookieValue
          console.log(`✅ [DEBUG-AUTH] Found auth token in: ${cookieName}`)
        }
      }
    }

    // Step 2: Check headers
    console.log("🔍 [DEBUG-AUTH] Step 2: Checking headers...")
    const headerData: any = {
      authorization: request.headers.get("authorization"),
      cookie: request.headers.get("cookie"),
      userAgent: request.headers.get("user-agent"),
      contentType: request.headers.get("content-type"),
    }

    console.log("📋 [DEBUG-AUTH] Headers:", headerData)

    // Step 3: Token verification
    console.log("🔍 [DEBUG-AUTH] Step 3: Verifying token...")
    const tokenVerification: any = {
      success: false,
      error: null,
      payload: null,
    }

    if (cookieData.authToken) {
      try {
        const payload = verifyToken(cookieData.authToken)
        if (payload) {
          tokenVerification.success = true
          tokenVerification.payload = payload
          console.log("✅ [DEBUG-AUTH] Token verification successful:", payload)
        } else {
          tokenVerification.success = false
          tokenVerification.error = "Token verification returned null"
          console.log("❌ [DEBUG-AUTH] Token verification failed: returned null")
        }
      } catch (error) {
        tokenVerification.success = false
        tokenVerification.error = error instanceof Error ? error.message : "Unknown token error"
        console.log("❌ [DEBUG-AUTH] Token verification error:", error)
      }
    } else {
      tokenVerification.success = false
      tokenVerification.error = "No auth token found"
      console.log("❌ [DEBUG-AUTH] No auth token found in cookies")
    }

    // Step 4: User lookup
    console.log("🔍 [DEBUG-AUTH] Step 4: Looking up user...")
    const userLookup: any = {
      success: false,
      error: null,
      user: null,
    }

    if (tokenVerification.success && tokenVerification.payload) {
      try {
        // Import neon here to avoid circular dependencies
        const { neon } = await import("@neondatabase/serverless")
        const sql = neon(process.env.DATABASE_URL!)

        const userId = tokenVerification.payload.userId
        console.log("🔍 [DEBUG-AUTH] Looking up user ID:", userId)

        const users = await sql`
          SELECT id, username, email, role, status, is_verified, created_at, last_login_at
          FROM users 
          WHERE id = ${userId}
        `

        if (users.length > 0) {
          userLookup.success = true
          userLookup.user = users[0]
          console.log("✅ [DEBUG-AUTH] User found:", {
            id: users[0].id,
            username: users[0].username,
            role: users[0].role,
            status: users[0].status,
          })
        } else {
          userLookup.success = false
          userLookup.error = `No user found with ID: ${userId}`
          console.log("❌ [DEBUG-AUTH] No user found for ID:", userId)
        }
      } catch (error) {
        userLookup.success = false
        userLookup.error = error instanceof Error ? error.message : "Unknown database error"
        console.log("❌ [DEBUG-AUTH] User lookup error:", error)
      }
    } else {
      userLookup.success = false
      userLookup.error = "Cannot lookup user without valid token"
      console.log("❌ [DEBUG-AUTH] Cannot lookup user: no valid token")
    }

    // Step 5: Server auth result
    console.log("🔍 [DEBUG-AUTH] Step 5: Testing server auth function...")
    const serverAuthResult: any = {
      success: false,
      error: null,
      user: null,
    }

    try {
      const user = await getCurrentUserFromRequest(request)
      if (user) {
        serverAuthResult.success = true
        serverAuthResult.user = user
        console.log("✅ [DEBUG-AUTH] Server auth successful:", {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
        })
      } else {
        serverAuthResult.success = false
        serverAuthResult.error = "getCurrentUserFromRequest returned null"
        console.log("❌ [DEBUG-AUTH] Server auth failed: returned null")
      }
    } catch (error) {
      serverAuthResult.success = false
      serverAuthResult.error = error instanceof Error ? error.message : "Unknown server auth error"
      console.log("❌ [DEBUG-AUTH] Server auth error:", error)
    }

    // Step 6: Admin permission check
    console.log("🔍 [DEBUG-AUTH] Step 6: Checking admin permissions...")
    const adminCheck: any = {
      success: false,
      error: null,
      hasAdminRole: false,
      allowedRoles: ["admin", "owner", "moderator"],
    }

    if (serverAuthResult.success && serverAuthResult.user) {
      const userRole = serverAuthResult.user.role
      adminCheck.hasAdminRole = adminCheck.allowedRoles.includes(userRole)

      if (adminCheck.hasAdminRole) {
        adminCheck.success = true
        console.log("✅ [DEBUG-AUTH] Admin permissions granted:", userRole)
      } else {
        adminCheck.success = false
        adminCheck.error = `User role '${userRole}' not in allowed roles: ${adminCheck.allowedRoles.join(", ")}`
        console.log("❌ [DEBUG-AUTH] Admin permissions denied:", userRole)
      }
    } else {
      adminCheck.success = false
      adminCheck.error = "Cannot check admin permissions without authenticated user"
      console.log("❌ [DEBUG-AUTH] Cannot check admin permissions: no authenticated user")
    }

    // Compile final result
    const finalResult = {
      success: serverAuthResult.success && adminCheck.success,
      message:
        serverAuthResult.success && adminCheck.success
          ? "Authentication and admin permissions successful"
          : "Authentication or admin permissions failed",
      cookies: cookieData,
      headers: headerData,
      tokenVerification,
      userLookup,
      serverAuthResult,
      adminCheck,
      timestamp: new Date().toISOString(),
    }

    console.log("🏁 [DEBUG-AUTH] Final result:", {
      success: finalResult.success,
      message: finalResult.message,
    })

    return NextResponse.json(finalResult)
  } catch (error) {
    console.error("❌ [DEBUG-AUTH] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
