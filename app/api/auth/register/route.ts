import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/auth-system"

export async function POST(request: NextRequest) {
  console.log("📝 [API-REGISTER] Registration request received")

  try {
    const body = await request.json()
    const { username, email, password, role } = body

    // Validate input
    if (!username || !email || !password) {
      console.log("❌ [API-REGISTER] Missing required fields")
      return NextResponse.json(
        {
          success: false,
          error: "Username, email, and password are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("❌ [API-REGISTER] Invalid email format")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
        },
        { status: 400 },
      )
    }

    // Validate password length
    if (password.length < 6) {
      console.log("❌ [API-REGISTER] Password too short")
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Create user
    const result = await createUser({
      username,
      email,
      password,
      role: role || "user",
    })

    if (result.success) {
      console.log("✅ [API-REGISTER] User registered successfully")
      return NextResponse.json({
        success: true,
        message: "User registered successfully",
        user: result.user,
      })
    } else {
      console.log("❌ [API-REGISTER] Registration failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ [API-REGISTER] Server error:", error)
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
