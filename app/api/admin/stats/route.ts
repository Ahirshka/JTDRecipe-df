import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: Request) {
  try {
    console.log("🔄 [ADMIN-STATS] Getting admin statistics...")

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
    console.log("📊 [ADMIN-STATS] Fetching user statistics...")
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as active_users
      FROM users
    `

    // Get recipe statistics with detailed logging
    console.log("📊 [ADMIN-STATS] Fetching recipe statistics...")
    const recipeStats = await sql`
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'approved' AND is_published = true) as published_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'rejected') as rejected_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_recipes
      FROM recipes
    `

    console.log("📊 [ADMIN-STATS] Raw recipe stats:", recipeStats[0])

    // Get comment statistics (with fallback for missing table)
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

    // Get recent activity
    console.log("📊 [ADMIN-STATS] Fetching recent activity...")
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

    console.log("📊 [ADMIN-STATS] Recent activity count:", recentActivity.length)

    const stats = {
      totalUsers: Number.parseInt(userStats[0]?.total_users || "0"),
      activeUsers: Number.parseInt(userStats[0]?.active_users || "0"),
      totalRecipes: Number.parseInt(recipeStats[0]?.total_recipes || "0"),
      pendingRecipes: Number.parseInt(recipeStats[0]?.pending_recipes || "0"),
      publishedRecipes: Number.parseInt(recipeStats[0]?.published_recipes || "0"),
      approvedRecipes: Number.parseInt(recipeStats[0]?.approved_recipes || "0"),
      rejectedRecipes: Number.parseInt(recipeStats[0]?.rejected_recipes || "0"),
      totalComments: Number.parseInt(commentStats[0]?.total_comments || "0"),
      flaggedComments: Number.parseInt(commentStats[0]?.flagged_comments || "0"),
      recentActivity: recentActivity.map((activity: any) => ({
        type: activity.activity_type,
        description: activity.description,
        timestamp: activity.timestamp,
        userName: activity.user_name,
        status: activity.moderation_status,
      })),
    }

    console.log("✅ [ADMIN-STATS] Final stats:", {
      totalUsers: stats.totalUsers,
      totalRecipes: stats.totalRecipes,
      pendingRecipes: stats.pendingRecipes,
      publishedRecipes: stats.publishedRecipes,
      approvedRecipes: stats.approvedRecipes,
      rejectedRecipes: stats.rejectedRecipes,
    })

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ [ADMIN-STATS] Failed to get admin stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get admin stats",
        details: error instanceof Error ? error.message : "Unknown error",
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalRecipes: 0,
          pendingRecipes: 0,
          publishedRecipes: 0,
          approvedRecipes: 0,
          rejectedRecipes: 0,
          totalComments: 0,
          flaggedComments: 0,
          recentActivity: [],
        },
      },
      { status: 500 },
    )
  }
}
