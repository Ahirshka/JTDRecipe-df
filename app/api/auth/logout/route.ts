import { type NextRequest, NextResponse } from "next/server"
import { deleteSessionByToken } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-LOGOUT-API] Logout request received")

  try {
    // Get session token from cookies
    const sessionToken = cookies().get("session_token")?.value

    if (!sessionToken) {
      console.log("❌ [AUTH-LOGOUT-API] No session token found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          details: "No session token found",
        },
        { status: 401 },
      )
    }

    console.log(`🔍 [AUTH-LOGOUT-API] Deleting session: ${sessionToken.substring(0, 10)}...`)

    // Delete session from database
    const deleted = await deleteSessionByToken(sessionToken)

    if (!deleted) {
      console.log("❌ [AUTH-LOGOUT-API] Failed to delete session")
    } else {
      console.log("✅ [AUTH-LOGOUT-API] Session deleted successfully")
    }

    // Clear session cookie regardless of database deletion result
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
      message: "Logout successful",
    })
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT-API] Logout error:", error)

    // Clear cookie even if there was an error
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
