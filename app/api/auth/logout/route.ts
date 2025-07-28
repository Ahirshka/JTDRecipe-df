import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🚪 [AUTH-LOGOUT] Logout request received")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [AUTH-LOGOUT] Session token present:", !!sessionToken)

    if (sessionToken) {
      // Delete session from database
      console.log("🗑️ [AUTH-LOGOUT] Deleting session from database...")
      await sql`
        DELETE FROM user_sessions
        WHERE session_token = ${sessionToken}
      `
      console.log("✅ [AUTH-LOGOUT] Session deleted from database")
    }

    console.log("✅ [AUTH-LOGOUT] Logout completed successfully")

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    })

    // Clear session cookie
    response.cookies.set("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    return response
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
