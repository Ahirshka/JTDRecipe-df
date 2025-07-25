import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔐 [LOGIN-API] Login request received")

  try {
    const body = await request.json()
    const { email, password } = body

    console.log("📧 [LOGIN-API] Login attempt for email:", email)

    // Validate input
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
    console.log("🔍 [LOGIN-API] Looking up user by email...")
    const user = await findUserByEmail(email)

    if (!user) {
      console.log("❌ [LOGIN-API] User not found")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          details: "User not found",
        },
        { status: 401 },
      )
    }

    console.log("✅ [LOGIN-API] User found:", {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    })

    // Verify password
    console.log("🔐 [LOGIN-API] Verifying password...")
    const isPasswordValid = await verifyUserPassword(user, password)

    if (!isPasswordValid) {
      console.log("❌ [LOGIN-API] Password verification failed")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          details: "Incorrect password",
        },
        { status: 401 },
      )
    }

    console.log("✅ [LOGIN-API] Password verified successfully")

    // Create session
    console.log("🎫 [LOGIN-API] Creating session...")
    const session = await createSession(user.id)

    if (!session) {
      console.log("❌ [LOGIN-API] Session creation failed")
      return NextResponse.json(
        {
          success: false,
          error: "Session creation failed",
        },
        { status: 500 },
      )
    }

    console.log("✅ [LOGIN-API] Session created successfully")

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expires,
      path: "/",
    })

    console.log("🍪 [LOGIN-API] Session cookie set")

    // Return success response
    const response = {
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
      session: {
        token: session.token,
        expires: session.expires,
      },
    }

    console.log("✅ [LOGIN-API] Login completed successfully for user:", user.username)

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [LOGIN-API] Login error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
