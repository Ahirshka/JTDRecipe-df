import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ success: false, error: "Reset token is required" }, { status: 400 })
    }

    // For demo purposes, we'll accept any token
    // In production, you would verify the token against your database
    console.log("Verifying reset token:", token)

    return NextResponse.json({
      success: true,
      message: "Reset token is valid",
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
