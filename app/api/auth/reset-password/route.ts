import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and password are required" }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    // For demo purposes, we'll accept any token
    // In production, you would verify the token and update the user's password
    const passwordHash = await bcrypt.hash(password, 10)
    console.log("Resetting password with token:", token, "New hash:", passwordHash)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
