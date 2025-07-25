import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [LOGIN] Starting login process")

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (dbError) {
      console.error("❌ [LOGIN] Database initialization failed:", dbError)
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ [LOGIN] Invalid JSON in request body:", error)
      return NextResponse.json({ success: false, error: "Invalid request format" }, { status: 400 })
    }

    const { email, password } = body

    console.log("🔍 [LOGIN] Login attempt for email:", email)

    // Validate required fields
    if (!email || !password) {
      console.log("❌ [LOGIN] Missing required fields")
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Validate field formats
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address" }, { status: 400 })
    }

    if (typeof password !== "string") {
      return NextResponse.json({ success: false, error: "Invalid password format" }, { status: 400 })
    }

    console.log("🔍 [LOGIN] Finding user by email:", email)

    // Find user by email
    const user = await findUserByEmail(email.toLowerCase().trim())
    if (!user) {
      console.log("❌ [LOGIN] User not found with email:", email)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    console.log("🔍 [LOGIN] User found:", { id: user.id, username: user.username, status: user.status })

    // Check if user account is active
    if (user.status !== "active") {
      console.log("❌ [LOGIN] User account is not active:", user.status)
      return NextResponse.json(
        { success: false, error: "Account is not active. Please contact support." },
        { status: 403 },
      )
    }

    console.log("🔍 [LOGIN] Verifying password for user:", user.username)

    // Verify password
    const isValidPassword = await verifyUserPassword(user, password)
    if (!isValidPassword) {
      console.log("❌ [LOGIN] Invalid password for user:", user.username)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    console.log("✅ [LOGIN] Password verified successfully")

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-for-development"
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: "7d" },
    )

    console.log("🔍 [LOGIN] Creating session")

    // Create session
    await createSession(user.id, token)

    console.log("✅ [LOGIN] Session created successfully")

    // Remove sensitive data from response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: userResponse,
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ [LOGIN] Login completed successfully")
    return response
  } catch (error) {
    console.error("❌ [LOGIN] Login error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error. Please try again later.",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
