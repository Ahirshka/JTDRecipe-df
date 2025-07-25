import { type NextRequest, NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/server-auth"
import { logoutUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [LOGOUT] Processing logout request")

    // Get token from cookies
    const token = request.cookies.get("auth-token")?.value || request.cookies.get("auth_token")?.value

    if (token) {
      console.log("🔍 [LOGOUT] Invalidating session for token")
      await logoutUser(token)
    }

    // Clear authentication cookies
    await clearAuthCookie()

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear cookies in response
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("✅ [LOGOUT] Logout successful")
    return response
  } catch (error) {
    console.error("❌ [LOGOUT] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
