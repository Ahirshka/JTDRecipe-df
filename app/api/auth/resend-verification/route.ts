import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // For demo purposes, we'll just return success
    // In production, you would send an actual verification email
    console.log("Resending verification email to:", email)

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
    })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
