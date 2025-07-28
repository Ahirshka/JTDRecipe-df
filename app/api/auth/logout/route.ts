import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🚪 [AUTH-LOGOUT] Logout request received")

  try {
    // Get all possible token cookies
    const authToken = request.cookies.get("auth-token")?.value
    const authTokenAlt = request.cookies.get("auth_token")?.value
    const sessionToken = request.cookies.get("session_token")?.value

    console.log("🔍 [AUTH-LOGOUT] Found cookies:", {
      authToken: !!authToken,
      authTokenAlt: !!authTokenAlt,
      sessionToken: !!sessionToken,
    })

    console.log("✅ [AUTH-LOGOUT] Logout completed successfully")

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    })

    // Clear all possible cookie names
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 0, // Expire immediately
      path: "/",
    }

    response.cookies.set("auth-token", "", cookieOptions)
    response.cookies.set("auth_token", "", cookieOptions)
    response.cookies.set("session_token", "", cookieOptions)

    console.log("🍪 [AUTH-LOGOUT] All authentication cookies cleared")

    return response
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT] Error:", error)
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
