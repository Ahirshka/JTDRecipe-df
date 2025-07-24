import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const users = await sql`
      SELECT id, username, email, password_hash, role, is_verified, 
             COALESCE(status, 'active') as status
      FROM users 
      WHERE email = ${email}
    `

    if (!users[0]) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const user = users[0]

    // Check if account is blocked or suspended
    if (user.status === "blocked" || user.status === "suspended") {
      return NextResponse.json(
        {
          success: false,
          error: `Account is ${user.status}. Please contact support.`,
        },
        { status: 403 },
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Update last login
    await sql`
      UPDATE users 
      SET last_login_at = NOW() 
      WHERE id = ${user.id}
    `

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.is_verified,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
