import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, findUserByUsername, createUser } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-REGISTER-API] Registration request received")

  try {
    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.username || !body.email || !body.password) {
      console.log("❌ [AUTH-REGISTER-API] Missing required fields")
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
      console.log("❌ [AUTH-REGISTER-API] Invalid email format")
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
      console.log("❌ [AUTH-REGISTER-API] Password too short")
      return NextResponse.json(
        {
          success: false,
          error: "Password too short",
          details: "Password must be at least 6 characters long",
        },
        { status: 400 },
      )
    }

    console.log(`🔍 [AUTH-REGISTER-API] Checking if user exists: ${body.email}`)

    // Check if user already exists by email
    const existingUserByEmail = await findUserByEmail(body.email)
    if (existingUserByEmail) {
      console.log(`❌ [AUTH-REGISTER-API] User already exists with email: ${body.email}`)
      return NextResponse.json(
        {
          success: false,
          error: "User already exists",
          details: "A user with this email address already exists",
        },
        { status: 409 },
      )
    }

    // Check if user already exists by username
    const existingUserByUsername = await findUserByUsername(body.username)
    if (existingUserByUsername) {
      console.log(`❌ [AUTH-REGISTER-API] User already exists with username: ${body.username}`)
      return NextResponse.json(
        {
          success: false,
          error: "Username taken",
          details: "A user with this username already exists",
        },
        { status: 409 },
      )
    }

    console.log(`🔄 [AUTH-REGISTER-API] Creating new user: ${body.username}`)

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 12)

    // Create user
    const newUser = await createUser({
      username: body.username,
      email: body.email,
      password_hash: hashedPassword,
      role: "user",
      status: "active",
      is_verified: false,
    })

    if (!newUser) {
      console.log(`❌ [AUTH-REGISTER-API] Failed to create user: ${body.username}`)
      return NextResponse.json(
        {
          success: false,
          error: "User creation failed",
          details: "Unable to create user account",
        },
        { status: 500 },
      )
    }

    console.log(`✅ [AUTH-REGISTER-API] User created successfully: ${newUser.username}`)

    // Return user data (without password)
    const { password, password_hash, ...userData } = newUser

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      data: {
        user: userData,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-REGISTER-API] Registration error:", error)

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
