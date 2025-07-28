import { NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth-system"

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [AUTH-ME] Current user request received")

  try {
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

    console.log("✅ [AUTH-ME] Current user retrieved:", session.user.username)

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = session.user

    return NextResponse.json({
      success: true,
      user: {
        id: userWithoutPassword.id.toString(),
        username: userWithoutPassword.username,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
        status: userWithoutPassword.status,
        is_verified: userWithoutPassword.is_verified,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Error getting current user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
