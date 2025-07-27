import { type NextRequest, NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth-system"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("🔄 [API] Getting current user")

  try {
    const session = await getCurrentSession()

    console.log("🔄 [API] Session result:", {
      success: session.success,
      hasUser: !!session.user,
      error: session.error,
    })

    if (session.success && session.user) {
      console.log("✅ [API] Current user found:", session.user.username)
      return NextResponse.json({
        success: true,
        user: {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
          role: session.user.role,
          status: session.user.status,
          is_verified: session.user.is_verified,
          created_at: session.user.created_at,
        },
      })
    } else {
      console.log("❌ [API] No valid session found:", session.error)
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated",
          error: session.error,
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("❌ [API] Get current user error:", error)
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
