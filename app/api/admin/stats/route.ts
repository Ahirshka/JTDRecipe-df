import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("📊 [ADMIN-STATS] Starting admin stats request")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [ADMIN-STATS] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [ADMIN-STATS] No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session and get user
    console.log("🔍 [ADMIN-STATS] Verifying session...")
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [ADMIN-STATS] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [ADMIN-STATS] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [ADMIN-STATS] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [ADMIN-STATS] Admin access verified")

    // Initialize default stats
    let totalUsers = 0
    let totalRecipes = 0
    let pendingRecipes = 0
    let approvedRecipes = 0
    let rejectedRecipes = 0
    let totalComments = 0
    let flaggedComments = 0
    let totalRatings = 0
    let averageRating = 0
    let recentUsers = 0
    let recentRecipes = 0

    // Get user statistics
    console.log("📊 [ADMIN-STATS] Fetching user statistics...")
    try {
      const userStats = await sql`SELECT COUNT(*) as count FROM users`
      totalUsers = Number.parseInt(userStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total users:", totalUsers)

      const recentUserStats = await sql`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `
      recentUsers = Number.parseInt(recentUserStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Recent users:", recentUsers)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching user statistics:", error)
    }

    // Get recipe statistics
    console.log("📊 [ADMIN-STATS] Fetching recipe statistics...")
    try {
      const recipeStats = await sql`SELECT COUNT(*) as count FROM recipes`
      totalRecipes = Number.parseInt(recipeStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total recipes:", totalRecipes)

      const pendingStats = await sql`
        SELECT COUNT(*) as count 
        FROM recipes 
        WHERE moderation_status = 'pending'
      `
      pendingRecipes = Number.parseInt(pendingStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Pending recipes:", pendingRecipes)

      const approvedStats = await sql`
        SELECT COUNT(*) as count 
        FROM recipes 
        WHERE moderation_status = 'approved'
      `
      approvedRecipes = Number.parseInt(approvedStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Approved recipes:", approvedRecipes)

      const rejectedStats = await sql`
        SELECT COUNT(*) as count 
        FROM recipes 
        WHERE moderation_status = 'rejected'
      `
      rejectedRecipes = Number.parseInt(rejectedStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Rejected recipes:", rejectedRecipes)

      const recentRecipeStats = await sql`
        SELECT COUNT(*) as count 
        FROM recipes 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `
      recentRecipes = Number.parseInt(recentRecipeStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Recent recipes:", recentRecipes)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching recipe statistics:", error)
    }

    // Get comment statistics
    console.log("📊 [ADMIN-STATS] Fetching comment statistics...")
    try {
      const commentStats = await sql`SELECT COUNT(*) as count FROM comments`
      totalComments = Number.parseInt(commentStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total comments:", totalComments)

      const flaggedStats = await sql`
        SELECT COUNT(*) as count 
        FROM comments 
        WHERE is_flagged = true
      `
      flaggedComments = Number.parseInt(flaggedStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Flagged comments:", flaggedComments)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching comment statistics:", error)
    }

    // Get rating statistics
    console.log("📊 [ADMIN-STATS] Fetching rating statistics...")
    try {
      const ratingStats = await sql`SELECT COUNT(*) as count FROM ratings`
      totalRatings = Number.parseInt(ratingStats[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total ratings:", totalRatings)

      const avgStats = await sql`SELECT AVG(rating) as avg FROM ratings`
      averageRating = Number.parseFloat(avgStats[0]?.avg || "0")
      console.log("✅ [ADMIN-STATS] Average rating:", averageRating)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching rating statistics:", error)
    }

    const stats = {
      totalUsers,
      totalRecipes,
      pendingRecipes,
      approvedRecipes,
      rejectedRecipes,
      totalComments,
      flaggedComments,
      totalRatings,
      averageRating: Number(averageRating.toFixed(1)),
      recentUsers,
      recentRecipes,
      lastUpdated: new Date().toISOString(),
    }

    console.log("🎉 [ADMIN-STATS] All statistics compiled:", stats)

    return NextResponse.json({
      success: true,
      stats,
      message: "Admin statistics retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-STATS] Error:", error)
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
