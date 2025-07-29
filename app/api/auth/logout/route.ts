import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🚪 [AUTH-LOGOUT] Logout request started")

  try {
    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear all possible authentication cookies
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

    console.log("✅ [AUTH-LOGOUT] Authentication cookies cleared")

    return response
  } catch (error) {
    console.error("❌ [AUTH-LOGOUT] Logout error:", error)
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
