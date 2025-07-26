import { type NextRequest, NextResponse } from "next/server"
import { registerUser, loginUser } from "@/lib/auth-system"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Registration request received")

  try {
    const body = await request.json()
    const { username, email, password, role } = body

    console.log("🔄 [API] Registration attempt for:", { username, email, role })

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

    // Validate password strength
    if (password.length < 6) {
      console.log("❌ [API] Password too short")
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

    console.log("🔄 [API] Registration result:", {
      success: result.success,
      message: result.message,
      hasUser: !!result.user,
    })

    if (result.success && result.user) {
      console.log("✅ [API] Registration successful, now logging in user")

      // Automatically log in the user after successful registration
      const loginResult = await loginUser({
        email,
        password,
      })

      if (loginResult.success && loginResult.user) {
        console.log("✅ [API] Auto-login successful after registration")
        return NextResponse.json({
          success: true,
          message: "Registration and login successful! You can now submit recipes.",
          user: {
            id: loginResult.user.id,
            username: loginResult.user.username,
            email: loginResult.user.email,
            role: loginResult.user.role,
            status: loginResult.user.status,
            is_verified: loginResult.user.is_verified,
          },
          auto_login: true,
        })
      } else {
        console.log("⚠️ [API] Registration successful but auto-login failed")
        return NextResponse.json({
          success: true,
          message: "Registration successful! Please log in to continue.",
          user: {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            role: result.user.role,
            status: result.user.status,
            is_verified: result.user.is_verified,
          },
          auto_login: false,
        })
      }
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
