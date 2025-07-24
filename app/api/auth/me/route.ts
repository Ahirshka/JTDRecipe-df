import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        is_verified: user.is_verified,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
