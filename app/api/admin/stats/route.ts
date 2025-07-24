import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function GET() {
  try {
    await initializeDatabase()

    // Get user statistics
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as active_users
      FROM users
    `

    // Get recipe statistics
    const recipeStats = await sql`
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'approved' AND is_published = true) as published_recipes,
        COUNT(*) FILTER (WHERE moderation_status = 'rejected') as rejected_recipes
      FROM recipes
    `

    // Get recent activity
    const recentActivity = await sql`
      SELECT 
        'recipe_submitted' as activity_type,
        r.title as description,
        r.created_at as timestamp,
        u.username as user_name
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.created_at > NOW() - INTERVAL '7 days'
      ORDER BY r.created_at DESC
      LIMIT 10
    `

    const stats = {
      totalUsers: Number.parseInt(userStats[0]?.total_users || "0"),
      activeUsers: Number.parseInt(userStats[0]?.active_users || "0"),
      totalRecipes: Number.parseInt(recipeStats[0]?.total_recipes || "0"),
      pendingRecipes: Number.parseInt(recipeStats[0]?.pending_recipes || "0"),
      publishedRecipes: Number.parseInt(recipeStats[0]?.published_recipes || "0"),
      rejectedRecipes: Number.parseInt(recipeStats[0]?.rejected_recipes || "0"),
      recentActivity: recentActivity.map((activity: any) => ({
        type: activity.activity_type,
        description: activity.description,
        timestamp: activity.timestamp,
        userName: activity.user_name,
      })),
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Failed to get admin stats:", error)
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
          rejectedRecipes: 0,
          recentActivity: [],
        },
      },
      { status: 500 },
    )
  }
}
