import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth-system"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Login request received")

  try {
    const body = await request.json()
    const { email, password } = body

    console.log("🔄 [API] Login attempt for email:", email)

    // Validate input
    if (!email || !password) {
      console.log("❌ [API] Missing email or password")
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

    console.log("🔄 [API] Login result:", {
      success: result.success,
      message: result.message,
      hasUser: !!result.user,
    })

    if (result.success) {
      console.log("✅ [API] Login successful")
      return NextResponse.json({
        success: true,
        message: result.message,
        user: {
          id: result.user?.id,
          username: result.user?.username,
          email: result.user?.email,
          role: result.user?.role,
          status: result.user?.status,
        },
      })
    } else {
      console.log("❌ [API] Login failed:", result.message)
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("❌ [API] Login error:", error)
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
