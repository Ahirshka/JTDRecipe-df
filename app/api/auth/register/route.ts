import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-API] Register request received")

  try {
    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.username || !body.email || !body.password) {
      console.log("❌ [AUTH-API] Missing required fields")
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
      console.log(`❌ [AUTH-API] Invalid email format: ${body.email}`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email",
          details: "Please provide a valid email address",
        },
        { status: 400 },
      )
    }

    // Validate username (alphanumeric, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!usernameRegex.test(body.username)) {
      console.log(`❌ [AUTH-API] Invalid username format: ${body.username}`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username",
          details: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
        },
        { status: 400 },
      )
    }

    // Validate password (min 8 chars)
    if (body.password.length < 8) {
      console.log("❌ [AUTH-API] Password too short")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
          details: "Password must be at least 8 characters long",
        },
        { status: 400 },
      )
    }

    console.log(`🔍 [AUTH-API] Checking if email or username already exists: ${body.email}, ${body.username}`)

    // Check if email or username already exists
    const existingUsers = await sql`
      SELECT * FROM users 
      WHERE email = ${body.email} OR username = ${body.username};
    `

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0]

      if (existingUser.email === body.email) {
        console.log(`❌ [AUTH-API] Email already exists: ${body.email}`)
        return NextResponse.json(
          {
            success: false,
            error: "Email already exists",
            details: "This email is already registered",
          },
          { status: 409 },
        )
      }

      if (existingUser.username === body.username) {
        console.log(`❌ [AUTH-API] Username already exists: ${body.username}`)
        return NextResponse.json(
          {
            success: false,
            error: "Username already exists",
            details: "This username is already taken",
          },
          { status: 409 },
        )
      }
    }

    console.log(`🔄 [AUTH-API] Creating new user: ${body.username}, ${body.email}`)

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (username, email, password, role, status, is_verified)
      VALUES (${body.username}, ${body.email}, ${hashedPassword}, 'user', 'active', false)
      RETURNING id, username, email, role, status, is_verified, created_at;
    `

    const newUser = result[0]

    console.log(`✅ [AUTH-API] User registered successfully: ${newUser.username}`)

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: newUser,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("❌ [AUTH-API] Registration error:", error)

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
