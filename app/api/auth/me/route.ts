import { NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth-system"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("👤 [AUTH-ME] Current user request received")

  try {
    // Get current session
    const session = await getCurrentSession()

    if (!session.success || !session.user) {
      console.log("❌ [AUTH-ME] No valid session found")
      return NextResponse.json(
        {
          success: false,
          error: session.error || "No valid session",
        },
        { status: 401 },
      )
    }

    console.log("✅ [AUTH-ME] Current user found:", {
      id: session.user.id,
      username: session.user.username,
      role: session.user.role,
    })

    // Return user data (without password_hash)
    const userResponse = {
      id: session.user.id,
      username: session.user.username,
      email: session.user.email,
      role: session.user.role,
      status: session.user.status,
      is_verified: session.user.is_verified,
      created_at: session.user.created_at,
      updated_at: session.user.updated_at,
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Error getting current user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get current user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
