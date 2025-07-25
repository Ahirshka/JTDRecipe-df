import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findUserByEmail, createSession } from "@/lib/neon"
import { createSessionCookie } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  console.log("🔄 [LOGIN-API] POST request received")

  try {
    const body = await request.json()
    const { email, password } = body

    console.log("📧 [LOGIN-API] Login attempt for email:", email)

    if (!email || !password) {
      console.log("❌ [LOGIN-API] Missing email or password")
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const user = await findUserByEmail(email)
    if (!user) {
      console.log("❌ [LOGIN-API] User not found for email:", email)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    console.log("✅ [LOGIN-API] User found:", {
      id: user.id,
      username: user.username,
      status: user.status,
      is_verified: user.is_verified,
    })

    // Check if user account is active
    if (user.status !== "active") {
      console.log("❌ [LOGIN-API] User account not active:", user.status)
      return NextResponse.json(
        {
          success: false,
          error: "Account not active",
          details: `Your account status is: ${user.status}`,
        },
        { status: 403 },
      )
    }

    // Verify password
    if (!user.password_hash) {
      console.log("❌ [LOGIN-API] User has no password hash")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid account configuration",
        },
        { status: 500 },
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      console.log("❌ [LOGIN-API] Invalid password for user:", user.username)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    console.log("✅ [LOGIN-API] Password verified for user:", user.username)

    // Create session
    const sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    try {
      await createSession(user.id, sessionToken)
      console.log("✅ [LOGIN-API] Session created for user:", user.username)
    } catch (sessionError) {
      console.error("❌ [LOGIN-API] Failed to create session:", sessionError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create session",
        },
        { status: 500 },
      )
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
      },
    })

    // Set session cookie
    response.headers.set("Set-Cookie", createSessionCookie(sessionToken))

    console.log("✅ [LOGIN-API] Login successful for user:", user.username)
    return response
  } catch (error) {
    console.error("❌ [LOGIN-API] Login error:", error)
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
