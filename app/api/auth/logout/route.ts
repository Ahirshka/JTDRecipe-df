import { NextResponse } from "next/server"

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    // Clear the auth cookie
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Logout failed",
      },
      { status: 500 },
    )
  }
}
