import { type NextRequest, NextResponse } from "next/server"
import { findSessionByToken, findUserById } from "@/lib/neon"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("🔄 [AUTH-API] Me request received")

  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      console.log("❌ [AUTH-API] No session token found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          details: "No session token found",
        },
        { status: 401 },
      )
    }

    console.log(`🔍 [AUTH-API] Verifying session token: ${sessionToken.substring(0, 10)}...`)

    // Find session by token
    const session = await findSessionByToken(sessionToken)

    if (!session) {
      console.log(`❌ [AUTH-API] Invalid or expired session token: ${sessionToken.substring(0, 10)}...`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
          details: "Session token is invalid or expired",
        },
        { status: 401 },
      )
    }

    console.log(`✅ [AUTH-API] Valid session found for user ID: ${session.user_id}`)

    // Find user by ID
    const user = await findUserById(session.user_id)

    if (!user) {
      console.log(`❌ [AUTH-API] User not found for session: ${session.user_id}`)
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          details: "User associated with session not found",
        },
        { status: 404 },
      )
    }

    console.log(`✅ [AUTH-API] User found: ${user.username}`)

    // Return user data (without password)
    const { password, ...userData } = user

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("❌ [AUTH-API] Me error:", error)

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
