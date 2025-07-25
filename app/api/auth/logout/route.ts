import { type NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/auth-system"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🚪 [API-LOGOUT] Logout request received")

  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (sessionToken) {
      // Delete session from database
      await deleteSession(sessionToken)
      console.log("✅ [API-LOGOUT] Session deleted from database")
    }

    // Clear session cookie
    cookieStore.delete("session")
    console.log("✅ [API-LOGOUT] Session cookie cleared")

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("❌ [API-LOGOUT] Server error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
