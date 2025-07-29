import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-development"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🔐 [AUTH-LOGIN] Login attempt started")

  try {
    const body = await request.json()
    const { email, password } = body

    console.log("📧 [AUTH-LOGIN] Login attempt for email:", email)

    if (!email || !password) {
      console.log("❌ [AUTH-LOGIN] Missing email or password")
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    console.log("🔍 [AUTH-LOGIN] Looking up user in database...")
    const users = await sql`
      SELECT id, username, email, password_hash, role, status, is_verified, created_at, updated_at
      FROM users
      WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-LOGIN] User not found:", email)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]
    console.log("✅ [AUTH-LOGIN] User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    // Check if user is active
    if (user.status !== "active") {
      console.log("❌ [AUTH-LOGIN] User account is not active:", user.status)
      return NextResponse.json({ success: false, error: "Account is not active" }, { status: 401 })
    }

    // Verify password
    console.log("🔒 [AUTH-LOGIN] Verifying password...")
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      console.log("❌ [AUTH-LOGIN] Invalid password for user:", email)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    console.log("✅ [AUTH-LOGIN] Password verified successfully")

    // Generate JWT token
    console.log("🎫 [AUTH-LOGIN] Generating JWT token...")
    const tokenPayload = {
      userId: user.id.toString(),
      email: user.email,
      role: user.role,
      username: user.username,
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: "7d",
      issuer: "recipe-site",
      audience: "recipe-site-users",
    })

    console.log("✅ [AUTH-LOGIN] JWT token generated successfully")

    // Update last login time
    await sql`
      UPDATE users 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `

    // Create response with user data
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }

    console.log("🎉 [AUTH-LOGIN] Login successful for user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Create response
    const response = NextResponse.json({
      success: true,
      user: userData,
      message: "Login successful",
    })

    // Set multiple cookies for maximum compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    }

    response.cookies.set("auth-token", token, cookieOptions)
    response.cookies.set("auth_token", token, cookieOptions)
    response.cookies.set("session_token", token, cookieOptions)

    console.log("🍪 [AUTH-LOGIN] Authentication cookies set")

    return response
  } catch (error) {
    console.error("❌ [AUTH-LOGIN] Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
