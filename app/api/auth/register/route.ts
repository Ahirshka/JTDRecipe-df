import { type NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-REGISTER] POST request received")

  try {
    const body = await request.json()
    console.log("📝 [AUTH-REGISTER] Request body:", { ...body, password: "[REDACTED]" })

    const { username, email, password } = body

    // Validate required fields
    if (!username || !email || !password) {
      console.log("❌ [AUTH-REGISTER] Missing required fields")
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: "Username, email, and password are required",
        },
        { status: 400 },
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("❌ [AUTH-REGISTER] Invalid email format")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email format",
          details: "Please provide a valid email address",
        },
        { status: 400 },
      )
    }

    // Validate password strength
    if (password.length < 6) {
      console.log("❌ [AUTH-REGISTER] Password too short")
      return NextResponse.json(
        {
          success: false,
          error: "Password too short",
          details: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Check if user already exists
    const existingUserByEmail = await findUserByEmail(email)
    if (existingUserByEmail) {
      console.log("❌ [AUTH-REGISTER] Email already exists")
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists",
          details: "An account with this email already exists",
        },
        { status: 409 },
      )
    }

    const existingUserByUsername = await findUserByUsername(username)
    if (existingUserByUsername) {
      console.log("❌ [AUTH-REGISTER] Username already exists")
      return NextResponse.json(
        {
          success: false,
          error: "Username already exists",
          details: "This username is already taken",
        },
        { status: 409 },
      )
    }

    // Create new user
    const newUser = await createUser({
      username,
      email,
      password,
      role: "user",
      status: "active",
    })

    console.log("✅ [AUTH-REGISTER] User created successfully:", newUser.id)

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
          },
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ [AUTH-REGISTER] Registration error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Registration failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
