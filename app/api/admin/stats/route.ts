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
        COUNT(*) FILTER (WHERE status = 'active' OR status IS NULL) as active_users,
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

    // Get rejected recipes count (handle if table doesn't exist)
    let rejectedStats = [{ rejected_count: 0 }]
    try {
      rejectedStats = await sql`
        SELECT COUNT(*) as rejected_count FROM rejected_recipes
      `
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Rejected recipes table not found, using default count")
    }

    // Get recent activity
    const recentActivity = await sql`
      SELECT 
        'recipe_submitted' as activity_type,
        r.title as description,
        r.created_at as timestamp,
        u.username as user_name,
        r.moderation_status
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.created_at > NOW() - INTERVAL '7 days'
      ORDER BY r.created_at DESC
      LIMIT 10
    `

    const stats = {
      totalUsers: Number(userStats[0]?.total_users || 0),
      activeUsers: Number(userStats[0]?.active_users || 0),
      suspendedUsers: Number(userStats[0]?.suspended_users || 0),
      bannedUsers: Number(userStats[0]?.banned_users || 0),
      totalRecipes: Number(recipeStats[0]?.total_recipes || 0),
      pendingRecipes: Number(recipeStats[0]?.pending_recipes || 0),
      approvedRecipes: Number(recipeStats[0]?.approved_recipes || 0),
      rejectedRecipes: Number(recipeStats[0]?.rejected_recipes || 0) + Number(rejectedStats[0]?.rejected_count || 0),
      publishedRecipes: Number(recipeStats[0]?.published_recipes || 0),
      recentActivity: recentActivity.map((activity: any) => ({
        type: activity.activity_type,
        description: activity.description,
        timestamp: activity.timestamp,
        userName: activity.user_name,
        status: activity.moderation_status,
      })),
    }

    console.log("📊 [ADMIN-STATS] Statistics compiled:", {
      totalUsers: stats.totalUsers,
      totalRecipes: stats.totalRecipes,
      pendingRecipes: stats.pendingRecipes,
      approvedRecipes: stats.approvedRecipes,
      rejectedRecipes: stats.rejectedRecipes,
      publishedRecipes: stats.publishedRecipes,
    })

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
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          suspendedUsers: 0,
          bannedUsers: 0,
          totalRecipes: 0,
          pendingRecipes: 0,
          approvedRecipes: 0,
          rejectedRecipes: 0,
          publishedRecipes: 0,
          recentActivity: [],
        },
      },
      { status: 500 },
    )
  }
}
