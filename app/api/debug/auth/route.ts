import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  console.log("🔍 [AUTH-DEBUG] Starting authentication debug...")

  try {
    // Get cookies
    const cookies = request.cookies.getAll()
    const authToken = request.cookies.get("auth-token")?.value

    console.log(
      "🍪 [AUTH-DEBUG] Cookies:",
      cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
    )
    console.log("🔑 [AUTH-DEBUG] Auth token present:", !!authToken)

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      cookies: cookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
      authTokenPresent: !!authToken,
      headers: Object.fromEntries(request.headers.entries()),
    }

    // Test 1: Check if auth token exists
    if (!authToken) {
      debugInfo.error = "No auth token found in cookies"
      debugInfo.success = false
      return NextResponse.json(debugInfo)
    }

    // Test 2: Try to verify token manually
    try {
      const payload = verifyToken(authToken)
      debugInfo.tokenPayload = payload
      debugInfo.tokenValid = !!payload
      console.log("🔓 [AUTH-DEBUG] Token payload:", payload)
    } catch (tokenError) {
      debugInfo.tokenError = tokenError.message
      debugInfo.tokenValid = false
      console.log("❌ [AUTH-DEBUG] Token verification failed:", tokenError)
    }

    // Test 3: Try getCurrentUserFromRequest
    try {
      const user = await getCurrentUserFromRequest(request)
      debugInfo.currentUser = user
      debugInfo.userFound = !!user
      console.log("👤 [AUTH-DEBUG] Current user:", user)
    } catch (userError) {
      debugInfo.userError = userError.message
      debugInfo.userFound = false
      console.log("❌ [AUTH-DEBUG] Get current user failed:", userError)
    }

    debugInfo.success = true
    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("❌ [AUTH-DEBUG] Debug failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
