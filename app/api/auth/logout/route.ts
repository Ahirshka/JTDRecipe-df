import { type NextRequest, NextResponse } from "next/server"
import { deleteSessionByToken } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-LOGOUT-API] Logout request received")

  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (sessionToken) {
      console.log(`🗑️ [AUTH-LOGOUT-API] Deleting session: ${sessionToken.substring(0, 10)}...`)

      // Delete session from database
      await deleteSessionByToken(sessionToken)

      console.log(`✅ [AUTH-LOGOUT-API] Session deleted successfully`)
    } else {
      console.log("ℹ️ [AUTH-LOGOUT-API] No session token found to delete")
    }

    // Clear session cookie
    cookies().set({
      name: "session_token",
      value: "",
      httpOnly: true,
      path: "/",
      expires: new Date(0), // Expire immediately
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    console.log("✅ [AUTH-LOGOUT-API] Logout successful")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT-API] Logout error:", error)

    // Still clear the cookie even if database deletion fails
    cookies().set({
      name: "session_token",
      value: "",
      httpOnly: true,
      path: "/",
      expires: new Date(0),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
