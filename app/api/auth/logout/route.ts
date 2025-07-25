import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteUserSession } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [AUTH-LOGOUT] Starting logout process")

    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (token) {
      // Delete session from database
      await deleteUserSession(token)
      console.log("✅ [AUTH-LOGOUT] Session deleted from database")
    }

    // Clear cookie
    cookieStore.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("✅ [AUTH-LOGOUT] Logout successful")

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT] Logout error:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
