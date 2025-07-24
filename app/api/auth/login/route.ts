import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("Login attempt for:", email)

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
      SELECT 
        id, 
        username, 
        email, 
        password_hash, 
        role, 
        is_verified, 
        is_profile_verified,
        avatar_url,
        status,
        created_at
      FROM users 
      WHERE email = ${email.toLowerCase()}
    `

    console.log("Database query result:", users.length > 0 ? "User found" : "No user found")

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
    console.log("Found user:", { id: user.id, email: user.email, role: user.role })

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
    console.log("Verifying password...")
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    console.log("Password valid:", isValidPassword)

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
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" },
    )

    console.log("Login successful for user:", user.id)

    // Set cookie and return response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        is_profile_verified: user.is_profile_verified,
        avatar_url: user.avatar_url,
      },
    })

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
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
