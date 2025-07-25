import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  console.log("🔄 [AUTH-ME] GET request received")

  try {
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [AUTH-ME] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          details: "No valid session found",
        },
        { status: 401 },
      )
    }

    console.log("✅ [AUTH-ME] User authenticated:", user.username)

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            is_verified: user.is_verified,
            avatar_url: user.avatar_url,
            bio: user.bio,
            location: user.location,
            website: user.website,
          },
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("❌ [AUTH-ME] Authentication check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Authentication check failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
