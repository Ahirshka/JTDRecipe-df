import { type NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-API] Logout request received")

  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (sessionToken) {
      console.log(`🔄 [AUTH-API] Deleting session: ${sessionToken.substring(0, 10)}...`)

      // Delete session from database
      await deleteSession(sessionToken)
    }

    // Clear session cookie
    cookies().delete("session_token")

    console.log("✅ [AUTH-API] Logout successful")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("❌ [AUTH-API] Logout error:", error)

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
