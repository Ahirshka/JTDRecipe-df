import { type NextRequest, NextResponse } from "next/server"
import { deleteUserSession } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-LOGOUT] Logout request received")

  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (token) {
      // Delete session from database
      await deleteUserSession(token)
      console.log("✅ [AUTH-LOGOUT] Database session deleted")
    }

    // Clear the cookie
    cookieStore.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    console.log("✅ [AUTH-LOGOUT] Logout completed successfully")

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    })
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
