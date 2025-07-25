import { type NextRequest, NextResponse } from "next/server"
import { findSessionByToken, findUserById } from "@/lib/neon"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("🔍 [AUTH-ME-API] Authentication check request received")

  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      console.log("❌ [AUTH-ME-API] No session token found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          details: "No session token found",
        },
        { status: 401 },
      )
    }

    console.log(`🔍 [AUTH-ME-API] Checking session token: ${sessionToken.substring(0, 10)}...`)

    // Find session by token
    const session = await findSessionByToken(sessionToken)

    if (!session) {
      console.log(`❌ [AUTH-ME-API] Invalid or expired session token`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
          details: "Session token is invalid or expired",
        },
        { status: 401 },
      )
    }

    console.log(`✅ [AUTH-ME-API] Valid session found for user ID: ${session.user_id}`)

    // Find user by ID
    const user = await findUserById(session.user_id)

    if (!user) {
      console.log(`❌ [AUTH-ME-API] User not found for session: ${session.user_id}`)
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          details: "User associated with session no longer exists",
        },
        { status: 404 },
      )
    }

    console.log(`✅ [AUTH-ME-API] User authenticated: ${user.username}`)

    // Return user data (without password)
    const { password, ...userData } = user

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("❌ [AUTH-ME-API] Authentication check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Authentication check failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
