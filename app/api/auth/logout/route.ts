import { NextResponse } from "next/server"
import { deleteSessionByToken } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST() {
  console.log("🔄 [AUTH-LOGOUT] Processing logout request...")

  try {
    // Get session token from cookies
    const sessionToken = cookies().get("session_token")?.value

    if (sessionToken) {
      console.log(`🗑️ [AUTH-LOGOUT] Deleting session: ${sessionToken.substring(0, 10)}...`)

      // Delete session from database
      await deleteSessionByToken(sessionToken)

      console.log("✅ [AUTH-LOGOUT] Session deleted from database")
    } else {
      console.log("ℹ️ [AUTH-LOGOUT] No session token found")
    }

    // Clear session cookie
    cookies().set({
      name: "session_token",
      value: "",
      httpOnly: true,
      path: "/",
      expires: new Date(0),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    console.log("✅ [AUTH-LOGOUT] Session cookie cleared")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT] Logout error:", error)

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
