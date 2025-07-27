import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server-auth"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  console.log("🔄 [ADMIN-STATS] Starting admin stats request")

  try {
    // Check admin authentication
    console.log("🔍 [ADMIN-STATS] Checking admin authentication...")
    const user = await requireAdmin(request)
    console.log("✅ [ADMIN-STATS] Admin authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Initialize database tables if they don't exist
    console.log("🔍 [ADMIN-STATS] Ensuring database tables exist...")

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        is_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        cuisine VARCHAR(100),
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        author_username VARCHAR(255),
        moderation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        is_featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255),
        content TEXT NOT NULL,
        is_flagged BOOLEAN NOT NULL DEFAULT false,
        moderation_status VARCHAR(50) NOT NULL DEFAULT 'approved',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `

    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(recipe_id, user_id)
      );
    `

    console.log("✅ [ADMIN-STATS] Database tables ensured")

    // Get statistics with error handling for each query
    console.log("🔍 [ADMIN-STATS] Fetching statistics...")

    let totalUsers = 0
    let totalRecipes = 0
    let pendingRecipes = 0
    let totalComments = 0
    let flaggedComments = 0
    let totalRatings = 0

    try {
      const userResult = await sql`SELECT COUNT(*) as count FROM users`
      totalUsers = Number.parseInt(userResult[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total users:", totalUsers)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching user count:", error)
    }

    try {
      const recipeResult = await sql`SELECT COUNT(*) as count FROM recipes`
      totalRecipes = Number.parseInt(recipeResult[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total recipes:", totalRecipes)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching recipe count:", error)
    }

    try {
      const pendingResult = await sql`SELECT COUNT(*) as count FROM recipes WHERE moderation_status = 'pending'`
      pendingRecipes = Number.parseInt(pendingResult[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Pending recipes:", pendingRecipes)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching pending recipes:", error)
    }

    try {
      const commentResult = await sql`SELECT COUNT(*) as count FROM comments`
      totalComments = Number.parseInt(commentResult[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total comments:", totalComments)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching comment count:", error)
    }

    try {
      const flaggedResult = await sql`SELECT COUNT(*) as count FROM comments WHERE is_flagged = true`
      flaggedComments = Number.parseInt(flaggedResult[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Flagged comments:", flaggedComments)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching flagged comments:", error)
    }

    try {
      const ratingResult = await sql`SELECT COUNT(*) as count FROM ratings`
      totalRatings = Number.parseInt(ratingResult[0]?.count || "0")
      console.log("✅ [ADMIN-STATS] Total ratings:", totalRatings)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching rating count:", error)
    }

    const stats = {
      totalUsers,
      totalRecipes,
      pendingRecipes,
      totalComments,
      flaggedComments,
      totalRatings,
      lastUpdated: new Date().toISOString(),
    }

    console.log("✅ [ADMIN-STATS] Statistics compiled:", stats)

    return NextResponse.json({
      success: true,
      stats,
      message: "Admin statistics retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-STATS] Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const isAuthError = errorMessage.includes("Authentication") || errorMessage.includes("Admin")

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: isAuthError ? "Admin authentication required" : "Failed to load admin statistics",
        stats: {
          totalUsers: 0,
          totalRecipes: 0,
          pendingRecipes: 0,
          totalComments: 0,
          flaggedComments: 0,
          totalRatings: 0,
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: isAuthError ? 401 : 500 },
    )
  }
}
