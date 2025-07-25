import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, createSession, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [REGISTER] Starting registration process")

    // Initialize database if needed
    try {
      await initializeDatabase()
    } catch (dbError) {
      console.error("❌ [REGISTER] Database initialization failed:", dbError)
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      console.error("❌ [REGISTER] Invalid JSON in request body:", error)
      return NextResponse.json({ success: false, error: "Invalid request format" }, { status: 400 })
    }

    const { username, email, password } = body

    console.log("🔍 [REGISTER] Registration data:", { username, email, passwordLength: password?.length })

    // Validate required fields
    if (!username || !email || !password) {
      console.log("❌ [REGISTER] Missing required fields")
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Validate field formats
    if (typeof username !== "string" || username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { success: false, error: "Username must be between 3 and 30 characters" },
        { status: 400 },
      )
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please provide a valid email address" }, { status: 400 })
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    console.log("🔍 [REGISTER] Checking if user exists:", email)

    // Check if user already exists
    try {
      const existingUser = await findUserByEmail(email)
      if (existingUser) {
        console.log("❌ [REGISTER] User already exists with email:", email)
        return NextResponse.json({ success: false, error: "User already exists with this email" }, { status: 409 })
      }
    } catch (findError) {
      console.error("❌ [REGISTER] Error checking existing user:", findError)
      // Continue with registration if we can't check (table might not exist yet)
    }

    console.log("🔍 [REGISTER] Creating new user")

    // Create user
    const newUser = await createUser({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: "user",
      status: "active",
    })

    console.log("✅ [REGISTER] User created successfully:", newUser.id)

    // Create JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-for-development"
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      jwtSecret,
      { expiresIn: "7d" },
    )

    console.log("🔍 [REGISTER] Creating session")

    // Create session
    await createSession(newUser.id, token)

    console.log("✅ [REGISTER] Session created successfully")

    // Remove sensitive data from response
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      is_verified: newUser.is_verified,
      created_at: newUser.created_at,
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Registration successful",
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

    console.log("✅ [REGISTER] Registration completed successfully")
    return response
  } catch (error) {
    console.error("❌ [REGISTER] Registration error:", error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("duplicate key") || error.message.includes("UNIQUE constraint")) {
        return NextResponse.json({ success: false, error: "Username or email already exists" }, { status: 409 })
      }

      if (error.message.includes("invalid input syntax")) {
        return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 })
      }

      if (error.message.includes("relation") && error.message.includes("does not exist")) {
        return NextResponse.json(
          { success: false, error: "Database not initialized. Please contact support." },
          { status: 500 },
        )
      }
    }

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
