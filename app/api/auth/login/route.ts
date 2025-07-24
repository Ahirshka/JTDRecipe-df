import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const users = await sql`
      SELECT id, username, email, password_hash, role, status, email_verified, avatar, created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const user = users[0]

    // Check if account is active
    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Account is not active",
        },
        { status: 401 },
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
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
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        avatar: user.avatar,
        created_at: user.created_at,
        last_login_at: new Date().toISOString(),
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
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
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
