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
          user: null,
        },
        { status: 401 },
      )
    }

    console.log("✅ [AUTH-ME] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        is_profile_verified: user.is_profile_verified,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        website: user.website,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Error getting current user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
