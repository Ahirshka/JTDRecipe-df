import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession } from "@/lib/neon"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔄 [AUTH-API] Login request received")

  try {
    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.email || !body.password) {
      console.log("❌ [AUTH-API] Missing email or password")
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: "Email and password are required",
        },
        { status: 400 },
      )
    }

    console.log(`🔍 [AUTH-API] Looking up user with email: ${body.email}`)

    // Find user by email
    const user = await findUserByEmail(body.email)

    if (!user) {
      console.log(`❌ [AUTH-API] User not found with email: ${body.email}`)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          details: "User not found with this email",
        },
        { status: 401 },
      )
    }

    console.log(`✅ [AUTH-API] User found: ${user.username} (ID: ${user.id})`)
    console.log(`🔍 [AUTH-API] User details:`, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      has_password: !!user.password,
      password_length: user.password ? user.password.length : 0,
    })

    // Verify password
    console.log(`🔐 [AUTH-API] Verifying password for user: ${user.username}`)
    const isPasswordValid = await verifyUserPassword(user, body.password)

    if (!isPasswordValid) {
      console.log(`❌ [AUTH-API] Invalid password for user: ${user.username}`)
      console.log(`🔍 [AUTH-API] Password verification failed - checking password hash format`)

      // Additional debugging for password issues
      if (user.password) {
        console.log(`🔍 [AUTH-API] Stored password hash starts with: ${user.password.substring(0, 10)}...`)
        console.log(`🔍 [AUTH-API] Password hash length: ${user.password.length}`)
        console.log(`🔍 [AUTH-API] Input password: ${body.password}`)
      }

      return NextResponse.json(
        {
          success: false,
          error: "Invalid credentials",
          details: "Incorrect password",
        },
        { status: 401 },
      )
    }

    console.log(`✅ [AUTH-API] Password verified for user: ${user.username}`)

    // Check if user is active
    if (user.status !== "active") {
      console.log(`❌ [AUTH-API] User account not active: ${user.status}`)
      return NextResponse.json(
        {
          success: false,
          error: "Account inactive",
          details: `Your account status is: ${user.status}`,
        },
        { status: 403 },
      )
    }

    console.log(`🔄 [AUTH-API] Creating session for user: ${user.username}`)

    // Create session
    const session = await createSession(user.id)

    if (!session) {
      console.log(`❌ [AUTH-API] Failed to create session for user: ${user.username}`)
      return NextResponse.json(
        {
          success: false,
          error: "Session creation failed",
          details: "Unable to create user session",
        },
        { status: 500 },
      )
    }

    // Set session cookie
    cookies().set({
      name: "session_token",
      value: session.token,
      httpOnly: true,
      path: "/",
      expires: session.expires,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    console.log(`✅ [AUTH-API] Login successful for user: ${user.username}`)

    // Return user data (without password)
    const { password, ...userData } = user

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: userData,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-API] Login error:", error)

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
