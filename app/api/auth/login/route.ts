import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession } from "@/lib/neon"
import { sign } from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-LOGIN] Login request received")

  try {
    const body = await request.json()
    const { email, password } = body

    console.log("📝 [AUTH-LOGIN] Login attempt for email:", email)

    // Validation
    if (!email || !password) {
      console.log("❌ [AUTH-LOGIN] Missing credentials")
      return NextResponse.json(
        {
          success: false,
          error: "Missing credentials",
          details: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user
    const user = await findUserByEmail(email.trim().toLowerCase())
    if (!user) {
      console.log("❌ [AUTH-LOGIN] User not found")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          details: "Email or password is incorrect",
        },
        { status: 401 },
      )
    }

    // Verify password
    const isPasswordValid = await verifyUserPassword(user, password)
    if (!isPasswordValid) {
      console.log("❌ [AUTH-LOGIN] Invalid password")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          details: "Email or password is incorrect",
        },
        { status: 401 },
      )
    }

    // Check account status
    if (user.status !== "active") {
      console.log("❌ [AUTH-LOGIN] Account not active:", user.status)
      return NextResponse.json(
        {
          success: false,
          error: "Account not active",
          details: `Your account status is: ${user.status}`,
        },
        { status: 403 },
      )
    }

    console.log("✅ [AUTH-LOGIN] User authenticated:", user.username)

    // Create JWT token
    const token = sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Create database session
    await createSession(user.id, token)

    // Set HTTP-only cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ [AUTH-LOGIN] Login completed successfully")

    return NextResponse.json({
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
  } catch (error) {
    console.error("❌ [AUTH-LOGIN] Login error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
