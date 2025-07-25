import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { addLog } from "../../test/server-logs/route"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      addLog("info", "Unauthenticated user accessed /api/auth/me")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    addLog("info", "User accessed /api/auth/me", { userId: user.id })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
      },
    })
  } catch (error) {
    addLog("error", "/api/auth/me failed", { error: error.message })
    console.error("Error getting current user:", error)

    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
