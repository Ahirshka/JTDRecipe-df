import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createSession } from "@/lib/neon"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const user = await findUserByEmail(email)
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "7d",
    })

    // Create session
    await createSession(user.id, token)

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
