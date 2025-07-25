import { type NextRequest, NextResponse } from "next/server"
import { findSessionByToken, findUserById } from "@/lib/neon"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("👤 [ME-API] Authentication check request received")

  try {
    // Get session token from cookie
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("❌ [ME-API] No session token found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          details: "No session token",
        },
        { status: 401 },
      )
    }

    console.log("🎫 [ME-API] Session token found:", sessionToken.substring(0, 10) + "...")

    // Find session in database
    const session = await findSessionByToken(sessionToken)

    if (!session) {
      console.log("❌ [ME-API] Invalid or expired session")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          details: "Invalid or expired session",
        },
        { status: 401 },
      )
    }

    console.log("✅ [ME-API] Valid session found for user ID:", session.user_id)

    // Find user by ID
    const user = await findUserById(session.user_id)

    if (!user) {
      console.log("❌ [ME-API] User not found for session")
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          details: "User associated with session not found",
        },
        { status: 404 },
      )
    }

    console.log("✅ [ME-API] User authenticated:", {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    })

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.created_at,
      },
      session: {
        expires: session.expires,
        created_at: session.created_at,
      },
    })
  } catch (error) {
    console.error("❌ [ME-API] Authentication check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Authentication check failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
