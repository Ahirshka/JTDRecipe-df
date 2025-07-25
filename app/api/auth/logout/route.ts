import { type NextRequest, NextResponse } from "next/server"
import { deleteUserSession } from "@/lib/neon"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [LOGOUT] Starting logout process")

    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      console.log("🔍 [LOGOUT] Deleting session from database")

      // Delete session from database
      await deleteUserSession(token)

      console.log("✅ [LOGOUT] Session deleted from database")
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    })

    console.log("✅ [LOGOUT] Logout completed successfully")
    return response
  } catch (error) {
    console.error("❌ [LOGOUT] Logout error:", error)

    // Even if there's an error, we should still clear the cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  }
}
