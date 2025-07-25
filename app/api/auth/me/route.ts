import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [AUTH-ME] Getting current user")

    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [AUTH-ME] No authenticated user found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("✅ [AUTH-ME] User found:", user.username)

    return NextResponse.json({
      success: true,
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
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Error getting current user:", error)
    return NextResponse.json({ error: "Failed to get user information" }, { status: 500 })
  }
}
