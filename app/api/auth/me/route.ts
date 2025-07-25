import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/auth-system"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("👤 [API-ME] Get current user request")

  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("session")?.value

    if (!sessionToken) {
      console.log("❌ [API-ME] No session token found")
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        { status: 401 },
      )
    }

    // Validate session
    const user = await validateSession(sessionToken)

    if (!user) {
      console.log("❌ [API-ME] Invalid session")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid session",
        },
        { status: 401 },
      )
    }

    console.log("✅ [API-ME] User authenticated:", user.id)

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("❌ [API-ME] Server error:", error)
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
