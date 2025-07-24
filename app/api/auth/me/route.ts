import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"

export async function GET() {
  try {
    console.log("🔍 Checking authentication status...")

    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
          user: null,
        },
        { status: 401 },
      )
    }

    console.log(`✅ Authenticated user: ${user.username}`)

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
        created_at: user.created_at,
      },
    })
  } catch (error) {
    console.error("❌ Auth check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Authentication check failed",
        user: null,
      },
      { status: 500 },
    )
  }
}
