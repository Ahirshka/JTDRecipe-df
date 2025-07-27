import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-STATS] Fetching admin statistics")

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

    // Initialize stats object
    const stats = {
      totalUsers: 0,
      totalRecipes: 0,
      pendingRecipes: 0,
      approvedRecipes: 0,
      rejectedRecipes: 0,
      totalComments: 0,
      flaggedComments: 0,
      recentActivity: [],
    }

    try {
      // Get total users
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      stats.totalUsers = Number.parseInt(userCount[0]?.count || "0")
      console.log("📊 [ADMIN-STATS] Total users:", stats.totalUsers)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching user count:", error)
    }

    try {
      // Get total recipes
      const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
      stats.totalRecipes = Number.parseInt(recipeCount[0]?.count || "0")
      console.log("📊 [ADMIN-STATS] Total recipes:", stats.totalRecipes)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching recipe count:", error)
    }

    try {
      // Get pending recipes
      const pendingCount = await sql`
        SELECT COUNT(*) as count 
        FROM recipes 
        WHERE moderation_status = 'pending' OR moderation_status IS NULL
      `
      stats.pendingRecipes = Number.parseInt(pendingCount[0]?.count || "0")
      console.log("📊 [ADMIN-STATS] Pending recipes:", stats.pendingRecipes)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching pending recipe count:", error)
    }

    try {
      // Get approved recipes
      const approvedCount = await sql`
        SELECT COUNT(*) as count 
        FROM recipes 
        WHERE moderation_status = 'approved' AND is_published = true
      `
      stats.approvedRecipes = Number.parseInt(approvedCount[0]?.count || "0")
      console.log("📊 [ADMIN-STATS] Approved recipes:", stats.approvedRecipes)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching approved recipe count:", error)
    }

    try {
      // Get rejected recipes (from rejected_recipes table)
      const rejectedCount = await sql`
        SELECT COUNT(*) as count FROM rejected_recipes
      `
      stats.rejectedRecipes = Number.parseInt(rejectedCount[0]?.count || "0")
      console.log("📊 [ADMIN-STATS] Rejected recipes:", stats.rejectedRecipes)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching rejected recipe count (table may not exist):", error)
      // If rejected_recipes table doesn't exist, keep count as 0
    }

    try {
      // Get total comments
      const commentCount = await sql`SELECT COUNT(*) as count FROM comments`
      stats.totalComments = Number.parseInt(commentCount[0]?.count || "0")
      console.log("📊 [ADMIN-STATS] Total comments:", stats.totalComments)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching comment count (table may not exist):", error)
    }

    try {
      // Get flagged comments
      const flaggedCount = await sql`
        SELECT COUNT(*) as count 
        FROM comments 
        WHERE is_flagged = true
      `
      stats.flaggedComments = Number.parseInt(flaggedCount[0]?.count || "0")
      console.log("📊 [ADMIN-STATS] Flagged comments:", stats.flaggedComments)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching flagged comment count (table may not exist):", error)
    }

    try {
      // Get recent activity (last 10 recipes)
      const recentActivity = await sql`
        SELECT 
          id,
          title,
          author_username,
          moderation_status,
          is_published,
          created_at,
          updated_at
        FROM recipes 
        ORDER BY created_at DESC 
        LIMIT 10
      `
      stats.recentActivity = recentActivity.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        status: recipe.moderation_status || "pending",
        published: recipe.is_published || false,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
      }))
      console.log("📊 [ADMIN-STATS] Recent activity items:", stats.recentActivity.length)
    } catch (error) {
      console.log("⚠️ [ADMIN-STATS] Error fetching recent activity:", error)
    }

    console.log("✅ [ADMIN-STATS] Statistics compiled successfully:", {
      totalUsers: stats.totalUsers,
      totalRecipes: stats.totalRecipes,
      pendingRecipes: stats.pendingRecipes,
      approvedRecipes: stats.approvedRecipes,
      rejectedRecipes: stats.rejectedRecipes,
    })

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("❌ [ADMIN-STATS] Error fetching admin statistics:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admin statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
