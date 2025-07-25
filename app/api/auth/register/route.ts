import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth-system"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Registration request received")

  try {
    const body = await request.json()
    const { username, email, password, role } = body

    // Validate input
    if (!username || !email || !password) {
      console.log("❌ [API] Missing required fields")
      return NextResponse.json(
        {
          success: false,
          message: "Username, email, and password are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Attempt registration
    const result = await registerUser({
      username,
      email,
      password,
      role: role || "user",
    })

    if (result.success) {
      console.log("✅ [API] Registration successful")
      return NextResponse.json({
        success: true,
        message: result.message,
        user: {
          id: result.user?.id,
          username: result.user?.username,
          email: result.user?.email,
          role: result.user?.role,
        },
      })
    } else {
      console.log("❌ [API] Registration failed:", result.message)
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ [API] Registration error:", error)
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
