import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server-auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  console.log("📊 [ADMIN-STATS] Admin stats request received")

  try {
    // Require admin authentication
    const user = await requireAdmin(request)

    console.log("✅ [ADMIN-STATS] Admin access verified for:", user.username)

    // Get statistics from database
    const [userStats, recipeStats, commentStats, recentActivity] = await Promise.all([
      // User statistics
      sql`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
          COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
          COUNT(CASE WHEN role = 'owner' THEN 1 END) as owner_users
        FROM users
      `,

      // Recipe statistics
      sql`
        SELECT 
          COUNT(*) as total_recipes,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_recipes,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_recipes,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_recipes
        FROM recipes
      `,

      // Comment statistics
      sql`
        SELECT 
          COUNT(*) as total_comments,
          COUNT(CASE WHEN is_flagged = true THEN 1 END) as flagged_comments
        FROM comments
      `,

      // Recent activity (last 10 users)
      sql`
        SELECT username, email, role, created_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10
      `,
    ])

    const stats = {
      users: userStats[0] || {
        total_users: 0,
        active_users: 0,
        verified_users: 0,
        admin_users: 0,
        owner_users: 0,
      },
      recipes: recipeStats[0] || {
        total_recipes: 0,
        published_recipes: 0,
        pending_recipes: 0,
        rejected_recipes: 0,
      },
      comments: commentStats[0] || {
        total_comments: 0,
        flagged_comments: 0,
      },
      recent_activity: recentActivity || [],
    }

    console.log("✅ [ADMIN-STATS] Stats retrieved successfully:", {
      totalUsers: stats.users.total_users,
      totalRecipes: stats.recipes.total_recipes,
      totalComments: stats.comments.total_comments,
    })

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ [ADMIN-STATS] Error getting admin stats:", error)

    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 403 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
