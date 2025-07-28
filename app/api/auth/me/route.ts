import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("👤 [AUTH-ME] Getting current user")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [AUTH-ME] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [AUTH-ME] No session token found")
      return NextResponse.json({ success: false, error: "No session token" }, { status: 401 })
    }

    // Verify session and get user
    console.log("🔍 [AUTH-ME] Verifying session...")
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status, u.is_verified, u.created_at
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [AUTH-ME] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [AUTH-ME] User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
      message: "User retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get current user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
