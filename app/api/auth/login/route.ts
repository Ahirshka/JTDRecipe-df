import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: "Email and password are required",
      })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: "Database not configured",
      })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Find user by email
    const users = await sql`
      SELECT id, username, email, password_hash, role, status, email_verified, avatar
      FROM users 
      WHERE email = ${email}
    `

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid email or password",
      })
    }

    const user = users[0]

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json({
        success: false,
        error: "Account is suspended or inactive",
      })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: "Invalid email or password",
      })
    }

    // Update last login
    await sql`
      UPDATE users 
      SET last_login_at = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" })

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        avatar: user.avatar,
      },
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({
      success: false,
      error: "Login failed",
    })
  }
}
