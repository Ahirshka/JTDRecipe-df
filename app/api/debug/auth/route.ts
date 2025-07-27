import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { verifyToken } from "@/lib/auth"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("🔍 [DEBUG-AUTH] Starting authentication debug")

  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      cookies: {
        total: 0,
        names: [] as string[],
        authToken: null as string | null,
      },
      headers: {
        authorization: null as string | null,
        userAgent: null as string | null,
      },
      tokenVerification: {
        success: false,
        payload: null as any,
        error: null as string | null,
      },
      userLookup: {
        success: false,
        user: null as any,
        error: null as string | null,
      },
      serverAuthResult: {
        success: false,
        user: null as any,
        error: null as string | null,
      },
    }

    // Step 1: Check cookies
    console.log("🔍 [DEBUG-AUTH] Step 1: Checking cookies...")
    const cookieNames = ["auth-token", "auth_token", "auth_session", "session", "session_token"]

    for (const cookieName of cookieNames) {
      const cookieValue = request.cookies.get(cookieName)?.value
      if (cookieValue) {
        debugInfo.cookies.names.push(cookieName)
        if (!debugInfo.cookies.authToken) {
          debugInfo.cookies.authToken = cookieValue
        }
      }
    }

    debugInfo.cookies.total = debugInfo.cookies.names.length
    console.log("✅ [DEBUG-AUTH] Cookies found:", debugInfo.cookies.names)

    // Step 2: Check headers
    console.log("🔍 [DEBUG-AUTH] Step 2: Checking headers...")
    debugInfo.headers.authorization = request.headers.get("authorization")
    debugInfo.headers.userAgent = request.headers.get("user-agent")

    // Step 3: Verify token if found
    if (debugInfo.cookies.authToken) {
      console.log("🔍 [DEBUG-AUTH] Step 3: Verifying token...")
      try {
        const payload = verifyToken(debugInfo.cookies.authToken)
        if (payload) {
          debugInfo.tokenVerification.success = true
          debugInfo.tokenVerification.payload = payload
          console.log("✅ [DEBUG-AUTH] Token verification successful")
        } else {
          debugInfo.tokenVerification.error = "Token verification failed"
          console.log("❌ [DEBUG-AUTH] Token verification failed")
        }
      } catch (error) {
        debugInfo.tokenVerification.error = error instanceof Error ? error.message : "Unknown error"
        console.log("❌ [DEBUG-AUTH] Token verification error:", error)
      }
    } else {
      debugInfo.tokenVerification.error = "No auth token found"
      console.log("❌ [DEBUG-AUTH] No auth token found")
    }

    // Step 4: Test server auth function
    console.log("🔍 [DEBUG-AUTH] Step 4: Testing server auth function...")
    try {
      const user = await getCurrentUserFromRequest(request)
      if (user) {
        debugInfo.serverAuthResult.success = true
        debugInfo.serverAuthResult.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
        }
        console.log("✅ [DEBUG-AUTH] Server auth successful:", user.username)
      } else {
        debugInfo.serverAuthResult.error = "No user returned from server auth"
        console.log("❌ [DEBUG-AUTH] Server auth returned no user")
      }
    } catch (error) {
      debugInfo.serverAuthResult.error = error instanceof Error ? error.message : "Unknown error"
      console.log("❌ [DEBUG-AUTH] Server auth error:", error)
    }

    console.log("✅ [DEBUG-AUTH] Authentication debug completed")

    return NextResponse.json({
      success: true,
      message: "Authentication debug completed",
      ...debugInfo,
    })
  } catch (error) {
    console.error("❌ [DEBUG-AUTH] Debug failed:", error)
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
