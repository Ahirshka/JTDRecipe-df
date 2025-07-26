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

    // Get user statistics
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE status = 'banned') as banned_users
      FROM users
    `

    // Get recipe statistics
    const recipeStats = await sql`
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'rejected') as rejected_recipes,
        COUNT(*) FILTER (WHERE is_published = true) as published_recipes
      FROM recipes
    `

    // Get rejected recipes count
    const rejectedStats = await sql`
      SELECT COUNT(*) as rejected_count FROM rejected_recipes
    `

    // Get recent activity (optional - handle if comments table doesn't exist)
    let commentStats = [{ total_comments: 0, flagged_comments: 0 }]
    try {
      commentStats = await sql`
        SELECT 
          COUNT(*) as total_comments,
          COUNT(*) FILTER (WHERE is_flagged = true) as flagged_comments
        FROM comments
      `
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Comments table not found, using defaults")
    }

    const stats = {
      users: {
        total: Number(userStats[0]?.total_users || 0),
        active: Number(userStats[0]?.active_users || 0),
        suspended: Number(userStats[0]?.suspended_users || 0),
        banned: Number(userStats[0]?.banned_users || 0),
      },
      recipes: {
        total: Number(recipeStats[0]?.total_recipes || 0),
        pending: Number(recipeStats[0]?.pending_recipes || 0),
        approved: Number(recipeStats[0]?.approved_recipes || 0),
        rejected: Number(recipeStats[0]?.rejected_recipes || 0) + Number(rejectedStats[0]?.rejected_count || 0),
        published: Number(recipeStats[0]?.published_recipes || 0),
      },
      comments: {
        total: Number(commentStats[0]?.total_comments || 0),
        flagged: Number(commentStats[0]?.flagged_comments || 0),
      },
    }

    console.log("📊 [ADMIN-STATS] Statistics compiled:", stats)

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
