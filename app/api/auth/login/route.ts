import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth-system"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔐 [API-LOGIN] Login request received")

  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      console.log("❌ [API-LOGIN] Missing email or password")
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Attempt login
    const result = await loginUser(email, password)

    if (result.success && result.sessionToken) {
      // Set session cookie
      const cookieStore = await cookies()
      cookieStore.set("session", result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })

      console.log("✅ [API-LOGIN] Login successful, session cookie set")

      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: result.user,
      })
    } else {
      console.log("❌ [API-LOGIN] Login failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("❌ [API-LOGIN] Server error:", error)
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
