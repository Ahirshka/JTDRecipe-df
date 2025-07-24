import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { findUserById } from "@/lib/neon"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ success: false, error: "No token found" }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    // Get user from database
    const user = await findUserById(decoded.userId)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 401 })
    }

    // Return user data (excluding password)
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
  }
}
