import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth-system"

export async function POST(request: NextRequest) {
  console.log("🔐 [LOGIN-API] Login request received")

  try {
    const body = await request.json()
    const { email, password } = body

    console.log("🔍 [LOGIN-API] Login attempt for:", email)

    // Validate input
    if (!email || !password) {
      console.log("❌ [LOGIN-API] Missing email or password")
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Attempt login
    const result = await loginUser({ email, password })

    console.log("🔍 [LOGIN-API] Login result:", {
      success: result.success,
      message: result.message,
      hasUser: !!result.user,
    })

    if (result.success && result.user) {
      console.log("✅ [LOGIN-API] Login successful for:", result.user.username)

      return NextResponse.json({
        success: true,
        message: result.message,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status,
          is_verified: result.user.is_verified,
        },
      })
    } else {
      console.log("❌ [LOGIN-API] Login failed:", result.message)

      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("❌ [LOGIN-API] Login error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
