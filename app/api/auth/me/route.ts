import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [API] Getting current user")
    console.log("🔄 [AUTH] Getting current session")

    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [API] No valid session found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          user: null,
        },
        { status: 401 },
      )
    }

    console.log("✅ [API] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: Number(user.id),
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified || false,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH] Session validation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Authentication failed",
        user: null,
      },
      { status: 500 },
    )
  }
}
