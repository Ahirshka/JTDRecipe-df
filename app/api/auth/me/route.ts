import { NextResponse } from "next/server"
import { findSessionByToken, findUserById } from "@/lib/neon"
import { cookies } from "next/headers"

export async function GET() {
  console.log("🔍 [AUTH-ME] Checking authentication status...")

  try {
    // Get session token from cookies
    const sessionToken = cookies().get("session_token")?.value

    if (!sessionToken) {
      console.log("❌ [AUTH-ME] No session token found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          details: "No session token found",
        },
        { status: 401 },
      )
    }

    console.log(`🔍 [AUTH-ME] Found session token: ${sessionToken.substring(0, 10)}...`)

    // Find session in database
    const session = await findSessionByToken(sessionToken)

    if (!session) {
      console.log("❌ [AUTH-ME] Invalid or expired session")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
          details: "Session not found or expired",
        },
        { status: 401 },
      )
    }

    console.log(`✅ [AUTH-ME] Valid session found for user ID: ${session.user_id}`)

    // Get user details
    const user = await findUserById(session.user_id)

    if (!user) {
      console.log("❌ [AUTH-ME] User not found for session")
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          details: "User associated with session not found",
        },
        { status: 404 },
      )
    }

    console.log(`✅ [AUTH-ME] User authenticated: ${user.username}`)

    // Return user data (without password)
    const { password, ...userData } = user

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: {
          expires: session.expires,
        },
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Authentication check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Authentication check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
