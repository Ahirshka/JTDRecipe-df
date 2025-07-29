import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("📊 [ADMIN-STATS] Getting admin statistics")

  try {
    // Get current user and verify authentication
    console.log("🔍 [ADMIN-STATS] Verifying user authentication...")
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [ADMIN-STATS] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [ADMIN-STATS] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [ADMIN-STATS] User does not have admin privileges:", {
        username: user.username,
        role: user.role,
        requiredRoles: adminRoles,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
          details: `Your role '${user.role}' does not have admin privileges. Required: ${adminRoles.join(", ")}`,
        },
        { status: 403 },
      )
    }

    console.log("✅ [ADMIN-STATS] Admin access verified for:", user.username)

    // Ensure all required tables exist
    console.log("🔧 [ADMIN-STATS] Ensuring tables exist...")

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB,
        instructions JSONB,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        tags JSONB,
        image_url VARCHAR(500),
        author_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recipe_id, user_id)
      )
    `

    console.log("✅ [ADMIN-STATS] Tables verified/created")

    // Get comprehensive statistics
    console.log("📊 [ADMIN-STATS] Fetching statistics...")

    // User statistics
    const userStats = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN role IN ('admin', 'owner', 'moderator') THEN 1 END) as admin_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `

    // Recipe statistics
    const recipeStats = await sql`
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_recipes,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_recipes,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_recipes,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_recipes_30d
      FROM recipes
    `

    // Comment statistics
    const commentStats = await sql`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_comments,
        COUNT(CASE WHEN status = 'flagged' THEN 1 END) as flagged_comments,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_comments_30d
      FROM comments
    `

    // Rating statistics
    const ratingStats = await sql`
      SELECT 
        COUNT(*) as total_ratings,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_ratings_30d
      FROM ratings
    `

    // Recent activity
    const recentActivity = await sql`
      SELECT 
        'user' as type,
        username as title,
        'User registered' as action,
        created_at
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'recipe' as type,
        title,
        'Recipe submitted' as action,
        created_at
      FROM recipes
      WHERE created_at >= NOW() - INTERVAL '7 days'
      
      UNION ALL
      
      SELECT 
        'comment' as type,
        SUBSTRING(content, 1, 50) || '...' as title,
        'Comment posted' as action,
        created_at
      FROM comments
      WHERE created_at >= NOW() - INTERVAL '7 days'
      
      ORDER BY created_at DESC
      LIMIT 10
    `

    const stats = {
      users: {
        total: Number.parseInt(userStats[0]?.total_users || "0"),
        active: Number.parseInt(userStats[0]?.active_users || "0"),
        verified: Number.parseInt(userStats[0]?.verified_users || "0"),
        admins: Number.parseInt(userStats[0]?.admin_users || "0"),
        newThisMonth: Number.parseInt(userStats[0]?.new_users_30d || "0"),
      },
      recipes: {
        total: Number.parseInt(recipeStats[0]?.total_recipes || "0"),
        approved: Number.parseInt(recipeStats[0]?.approved_recipes || "0"),
        pending: Number.parseInt(recipeStats[0]?.pending_recipes || "0"),
        rejected: Number.parseInt(recipeStats[0]?.rejected_recipes || "0"),
        newThisMonth: Number.parseInt(recipeStats[0]?.new_recipes_30d || "0"),
      },
      comments: {
        total: Number.parseInt(commentStats[0]?.total_comments || "0"),
        active: Number.parseInt(commentStats[0]?.active_comments || "0"),
        flagged: Number.parseInt(commentStats[0]?.flagged_comments || "0"),
        newThisMonth: Number.parseInt(commentStats[0]?.new_comments_30d || "0"),
      },
      ratings: {
        total: Number.parseInt(ratingStats[0]?.total_ratings || "0"),
        average: Number.parseFloat(ratingStats[0]?.average_rating || "0"),
        newThisMonth: Number.parseInt(ratingStats[0]?.new_ratings_30d || "0"),
      },
      recentActivity: recentActivity.map((activity: any) => ({
        type: activity.type,
        title: activity.title,
        action: activity.action,
        createdAt: activity.created_at,
      })),
      currentUser: {
        id: user.id,
        username: user.username,
        role: user.role,
        hasAdminAccess: true,
      },
    }

    console.log("✅ [ADMIN-STATS] Statistics compiled successfully:", {
      totalUsers: stats.users.total,
      totalRecipes: stats.recipes.total,
      pendingRecipes: stats.recipes.pending,
      totalComments: stats.comments.total,
      currentUserRole: user.role,
    })

    return NextResponse.json({
      success: true,
      stats,
      message: "Statistics retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-STATS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get admin statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
