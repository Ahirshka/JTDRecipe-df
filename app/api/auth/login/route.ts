import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession } from "@/lib/neon"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [AUTH-LOGIN] Starting login process")

    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      console.log("❌ [AUTH-LOGIN] Missing email or password")
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    // Find user
    const user = await findUserByEmail(email)
    if (!user) {
      console.log("❌ [AUTH-LOGIN] User not found:", email)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyUserPassword(user, password)
    if (!isValidPassword) {
      console.log("❌ [AUTH-LOGIN] Invalid password for user:", email)
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 })
    }

    // Check if user is active
    if (user.status !== "active") {
      console.log("❌ [AUTH-LOGIN] User account not active:", email)
      return NextResponse.json({ success: false, error: "Account is not active" }, { status: 401 })
    }

    console.log("✅ [AUTH-LOGIN] User authenticated:", user.username)

    // Create session token
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    })

    // Create session in database
    await createSession(user.id, token)

    // Set cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ [AUTH-LOGIN] Login successful")

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-LOGIN] Login error:", error)
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
