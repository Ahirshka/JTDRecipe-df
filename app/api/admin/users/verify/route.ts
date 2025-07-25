import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import { getCurrentUser } from "@/lib/server-auth"
import { hasPermission } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Admin: User verification request...")
    await initializeDatabase()

    // Check if user is authenticated and has admin permissions
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (!hasPermission(user.role, "admin")) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: "User ID and action are required" }, { status: 400 })
    }

    if (!["verify", "unverify"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'verify' or 'unverify'" },
        { status: 400 },
      )
    }

    console.log(`🔄 Admin: ${action}ing user ${userId} by ${user.username}`)

    // Update user verification status
    await sql`
      UPDATE users 
      SET 
        is_profile_verified = ${action === "verify"},
        updated_at = NOW()
      WHERE id = ${userId}
    `

    console.log(`✅ Admin: User ${userId} ${action}ed successfully`)

    return NextResponse.json({
      success: true,
      message: `User ${action}ed successfully`,
      action,
      userId,
    })
  } catch (error) {
    console.error("❌ Admin: Error processing user verification:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process verification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
