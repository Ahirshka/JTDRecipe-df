import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { hasPermission, verifyUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Admin user verification request...")

    // Check if user is authenticated and has admin permissions
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (!hasPermission(user.role, "admin")) {
      console.log(`❌ User ${user.username} lacks admin permissions`)
      return NextResponse.json({ success: false, error: "Admin permissions required" }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    console.log(`🔄 Admin ${user.username} verifying user ${userId}`)

    const success = await verifyUser(userId)

    if (success) {
      console.log(`✅ User ${userId} verified successfully`)
      return NextResponse.json({
        success: true,
        message: "User verified successfully",
      })
    } else {
      console.log(`❌ Failed to verify user ${userId}`)
      return NextResponse.json({ success: false, error: "Failed to verify user" }, { status: 500 })
    }
  } catch (error) {
    console.error("❌ Error verifying user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
