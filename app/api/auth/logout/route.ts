import { type NextRequest, NextResponse } from "next/server"
import { deleteUserSession } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-LOGOUT] POST request received")

  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (sessionToken) {
      // Delete session from database
      await deleteUserSession(sessionToken)
      console.log("✅ [AUTH-LOGOUT] Session deleted from database")
    }

    // Clear the cookie
    cookieStore.delete("session_token")
    console.log("✅ [AUTH-LOGOUT] Session cookie cleared")

    return NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT] Logout error:", error)

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
