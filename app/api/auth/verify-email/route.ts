import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ success: false, error: "Verification token is required" }, { status: 400 })
    }

    // For demo purposes, we'll accept any token
    // In production, you would verify the token against your database
    console.log("Verifying email with token:", token)

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
