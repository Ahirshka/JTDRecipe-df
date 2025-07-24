import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    // For demo purposes, we'll just return success
    // In production, you would send an actual password reset email
    console.log("Sending password reset email to:", email)

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
