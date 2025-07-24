import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, createSession } from "@/lib/neon"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await createUser({
      username,
      email,
      password_hash: passwordHash,
      role: "user",
      is_verified: true, // Auto-verify for demo
    })

    // Create JWT token
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "7d",
    })

    // Create session
    await createSession(newUser.id, token)

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = newUser

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Registration successful",
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
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
