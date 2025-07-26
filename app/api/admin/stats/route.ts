import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-STATS] Getting admin statistics")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [ADMIN-STATS] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin/owner
    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [ADMIN-STATS] User lacks admin permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-STATS] Admin permissions verified for user:", user.username)

    // Get statistics
    const [totalUsersResult, totalRecipesResult, pendingRecipesResult, approvedRecipesResult, rejectedRecipesResult] =
      await Promise.all([
        sql`SELECT COUNT(*) as count FROM users`,
        sql`SELECT COUNT(*) as count FROM recipes`,
        sql`SELECT COUNT(*) as count FROM recipes WHERE moderation_status = 'pending'`,
        sql`SELECT COUNT(*) as count FROM recipes WHERE moderation_status = 'approved'`,
        sql`SELECT COUNT(*) as count FROM recipes WHERE moderation_status = 'rejected'`,
      ])

    const stats = {
      totalUsers: Number.parseInt(totalUsersResult[0].count),
      totalRecipes: Number.parseInt(totalRecipesResult[0].count),
      pendingRecipes: Number.parseInt(pendingRecipesResult[0].count),
      approvedRecipes: Number.parseInt(approvedRecipesResult[0].count),
      rejectedRecipes: Number.parseInt(rejectedRecipesResult[0].count),
    }

    console.log("✅ [ADMIN-STATS] Statistics retrieved:", stats)

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ [ADMIN-STATS] Error getting admin statistics:", error)
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
