import { type NextRequest, NextResponse } from "next/server"
import { deleteSessionByToken } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🚪 [LOGOUT-API] Logout request received")

  try {
    // Get session token from cookie
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("ℹ️ [LOGOUT-API] No session token found, already logged out")
      return NextResponse.json({
        success: true,
        message: "Already logged out",
      })
    }

    console.log("🎫 [LOGOUT-API] Session token found:", sessionToken.substring(0, 10) + "...")

    // Delete session from database
    const sessionDeleted = await deleteSessionByToken(sessionToken)

    if (sessionDeleted) {
      console.log("✅ [LOGOUT-API] Session deleted from database")
    } else {
      console.log("⚠️ [LOGOUT-API] Session not found in database (may have already expired)")
    }

    // Clear session cookie
    cookieStore.delete("session")
    console.log("🍪 [LOGOUT-API] Session cookie cleared")

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    console.error("❌ [LOGOUT-API] Logout error:", error)

    // Even if there's an error, clear the cookie
    const cookieStore = cookies()
    cookieStore.delete("session")

    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
