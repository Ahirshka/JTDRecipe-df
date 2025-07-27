import { NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth-system"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("👤 [ME-API] Current user request received")

  try {
    const session = await getCurrentSession()

    if (session.success && session.user) {
      console.log("✅ [ME-API] Current user found:", session.user.username)
      return NextResponse.json({
        success: true,
        user: {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
          role: session.user.role,
          status: session.user.status,
          is_verified: session.user.is_verified,
        },
      })
    } else {
      console.log("❌ [ME-API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("❌ [ME-API] Error getting current user:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
