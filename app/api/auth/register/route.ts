import { type NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-REGISTER] Registration request received")

  try {
    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.username || !body.email || !body.password) {
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
    if (!emailRegex.test(body.email)) {
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
    if (body.password.length < 6) {
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

    console.log(`🔍 [AUTH-REGISTER] Checking for existing user: ${body.email}`)

    // Check if user already exists by email
    const existingUserByEmail = await findUserByEmail(body.email)
    if (existingUserByEmail) {
      console.log("❌ [AUTH-REGISTER] Email already registered")
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
          details: "A user with this email already exists",
        },
        { status: 409 },
      )
    }

    // Check if username already exists
    const existingUserByUsername = await findUserByUsername(body.username)
    if (existingUserByUsername) {
      console.log("❌ [AUTH-REGISTER] Username already taken")
      return NextResponse.json(
        {
          success: false,
          error: "Username already taken",
          details: "This username is already in use",
        },
        { status: 409 },
      )
    }

    console.log(`👤 [AUTH-REGISTER] Creating new user: ${body.username}`)

    // Create new user
    const newUser = await createUser({
      username: body.username,
      email: body.email,
      password: body.password,
      role: "user",
      status: "active",
      is_verified: false,
    })

    if (!newUser) {
      throw new Error("Failed to create user")
    }

    console.log(`✅ [AUTH-REGISTER] User created successfully: ${newUser.username}`)

    // Return user data (without password)
    const { password, ...userData } = newUser

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userData,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-REGISTER] Registration error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Registration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
