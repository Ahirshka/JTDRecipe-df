import { type NextRequest, NextResponse } from "next/server"
import { createUser, findUserByEmail, findUserByUsername } from "@/lib/neon"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { createSession } from "@/lib/neon"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [AUTH-REGISTER] Starting registration process")

    const body = await request.json()
    const { username, email, password, confirmPassword } = body

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      console.log("❌ [AUTH-REGISTER] Missing required fields")
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      console.log("❌ [AUTH-REGISTER] Passwords don't match")
      return NextResponse.json({ success: false, error: "Passwords don't match" }, { status: 400 })
    }

    if (password.length < 6) {
      console.log("❌ [AUTH-REGISTER] Password too short")
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUserByEmail = await findUserByEmail(email)
    if (existingUserByEmail) {
      console.log("❌ [AUTH-REGISTER] Email already exists")
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 })
    }

    const existingUserByUsername = await findUserByUsername(username)
    if (existingUserByUsername) {
      console.log("❌ [AUTH-REGISTER] Username already exists")
      return NextResponse.json({ success: false, error: "Username already taken" }, { status: 400 })
    }

    // Create user
    const newUser = await createUser({
      username,
      email,
      password,
      role: "user",
      status: "active",
    })

    console.log("✅ [AUTH-REGISTER] User created:", newUser.id)

    // Create session token
    const token = jwt.sign({ userId: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, {
      expiresIn: "7d",
    })

    // Create session in database
    await createSession(newUser.id, token)

    // Set cookie
    const cookieStore = cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ [AUTH-REGISTER] Registration successful")

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-REGISTER] Registration error:", error)
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 })
  }
}
