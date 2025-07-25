import { type NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, findUserByUsername, createSession } from "@/lib/neon"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-REGISTER] Registration request received")

  try {
    const body = await request.json()
    const { username, email, password, confirmPassword } = body

    console.log("📝 [AUTH-REGISTER] Registration attempt for:", { username, email })

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      console.log("❌ [AUTH-REGISTER] Missing required fields")
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: "Username, email, password, and password confirmation are required",
        },
        { status: 400 },
      )
    }

    if (password !== confirmPassword) {
      console.log("❌ [AUTH-REGISTER] Password confirmation mismatch")
      return NextResponse.json(
        {
          success: false,
          error: "Password confirmation mismatch",
          details: "Password and confirmation password must match",
        },
        { status: 400 },
      )
    }

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

    // Check for existing users
    const existingUserByEmail = await findUserByEmail(email)
    if (existingUserByEmail) {
      console.log("❌ [AUTH-REGISTER] Email already exists")
      return NextResponse.json(
        {
          success: false,
          error: "Email already exists",
          details: "An account with this email address already exists",
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

    // Create user
    const newUser = await createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: "user",
      status: "active",
    })

    console.log("✅ [AUTH-REGISTER] User created successfully:", newUser.id)

    // Create session and JWT token
    const token = sign(
      {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Create database session
    await createSession(newUser.id, token)

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ [AUTH-REGISTER] Registration completed successfully")

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        is_verified: newUser.is_verified,
      },
    })
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
