import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession } from "@/lib/neon"
import { cookies } from "next/headers"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-LOGIN] POST request received")

  try {
    const body = await request.json()
    console.log("📝 [AUTH-LOGIN] Request body:", { ...body, password: "[REDACTED]" })

    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      console.log("❌ [AUTH-LOGIN] Missing required fields")
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const user = await findUserByEmail(email)
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

    // Check if user account is active
    if (user.status !== "active") {
      console.log("❌ [AUTH-LOGIN] User account not active:", user.status)
      return NextResponse.json(
        {
          success: false,
          error: "Account not active",
          details: `Your account status is: ${user.status}`,
        },
        { status: 403 },
      )
    }

    // Generate session token
    const sessionToken = randomBytes(32).toString("hex")

    // Create session in database
    await createSession(user.id, sessionToken)

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("✅ [AUTH-LOGIN] Login successful for user:", user.username)

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            is_verified: user.is_verified,
          },
        },
      },
      { status: 200 },
    )
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
