import { type NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/neon"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      // Delete session from database
      await deleteSession(token)
    }

    // Clear the cookie
    const response = NextResponse.json({
      success: true,
      message: "Logout successful",
    })

    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
