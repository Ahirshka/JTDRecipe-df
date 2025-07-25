import { type NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("📝 [REGISTER-API] Registration request received")

  try {
    const body = await request.json()
    const { username, email, password, role = "user" } = body

    console.log("👤 [REGISTER-API] Registration attempt:", {
      username,
      email,
      role,
    })

    // Validate input
    if (!username || !email || !password) {
      console.log("❌ [REGISTER-API] Missing required fields")
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
      console.log("❌ [REGISTER-API] Invalid email format")
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
      console.log("❌ [REGISTER-API] Password too short")
      return NextResponse.json(
        {
          success: false,
          error: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    // Check if user already exists by email
    console.log("🔍 [REGISTER-API] Checking if email already exists...")
    const existingUserByEmail = await findUserByEmail(email)

    if (existingUserByEmail) {
      console.log("❌ [REGISTER-API] Email already exists")
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
        },
        { status: 409 },
      )
    }

    // Check if user already exists by username
    console.log("🔍 [REGISTER-API] Checking if username already exists...")
    const existingUserByUsername = await findUserByUsername(username)

    if (existingUserByUsername) {
      console.log("❌ [REGISTER-API] Username already exists")
      return NextResponse.json(
        {
          success: false,
          error: "Username already taken",
        },
        { status: 409 },
      )
    }

    // Create new user
    console.log("👤 [REGISTER-API] Creating new user...")
    const newUser = await createUser({
      username,
      email,
      password,
      role,
      status: "active",
      is_verified: false,
    })

    if (!newUser) {
      console.log("❌ [REGISTER-API] User creation failed")
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create user",
        },
        { status: 500 },
      )
    }

    console.log("✅ [REGISTER-API] User created successfully:", {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    })

    // Return success response (without password)
    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        is_verified: newUser.is_verified,
        created_at: newUser.created_at,
      },
    })
  } catch (error) {
    console.error("❌ [REGISTER-API] Registration error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Registration failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
