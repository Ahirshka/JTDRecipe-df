import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("📊 [ADMIN-STATS] Starting admin stats request")

  try {
    // Check authentication and admin role
    console.log("🔍 [ADMIN-STATS] Checking authentication...")
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
      console.log("❌ [ADMIN-STATS] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [ADMIN-STATS] Admin access verified")

    // Initialize stats object
    const stats = {
      users: { total: 0, active: 0, verified: 0, admins: 0 },
      recipes: { total: 0, approved: 0, pending: 0, rejected: 0 },
      comments: { total: 0, flagged: 0 },
      ratings: { total: 0, average: 0 },
    }

    // Get user statistics
    console.log("📊 [ADMIN-STATS] Fetching user statistics...")
    try {
      // Ensure users table exists
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          is_verified BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `

      const userStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN is_verified = true THEN 1 END) as verified,
          COUNT(CASE WHEN role IN ('admin', 'owner', 'moderator') THEN 1 END) as admins
        FROM users;
      `

      if (userStats.length > 0) {
        stats.users = {
          total: Number.parseInt(userStats[0].total) || 0,
          active: Number.parseInt(userStats[0].active) || 0,
          verified: Number.parseInt(userStats[0].verified) || 0,
          admins: Number.parseInt(userStats[0].admins) || 0,
        }
      }

      console.log("✅ [ADMIN-STATS] User statistics fetched:", stats.users)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching user statistics:", error)
    }

    // Get recipe statistics
    console.log("📊 [ADMIN-STATS] Fetching recipe statistics...")
    try {
      // Ensure recipes table exists
      await sql`
        CREATE TABLE IF NOT EXISTS recipes (
          id VARCHAR(50) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          author_id INTEGER NOT NULL,
          author_username VARCHAR(50) NOT NULL,
          category VARCHAR(50) NOT NULL,
          difficulty VARCHAR(20) NOT NULL,
          prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes >= 0),
          cook_time_minutes INTEGER NOT NULL CHECK (cook_time_minutes >= 0),
          servings INTEGER NOT NULL CHECK (servings > 0),
          image_url TEXT,
          ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
          instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
          tags JSONB DEFAULT '[]'::jsonb,
          rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
          review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
          view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
          moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
          moderation_notes TEXT,
          is_published BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          search_vector TSVECTOR
        );
      `

      const recipeStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as approved,
          COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN moderation_status = 'rejected' THEN 1 END) as rejected
        FROM recipes;
      `

      if (recipeStats.length > 0) {
        stats.recipes = {
          total: Number.parseInt(recipeStats[0].total) || 0,
          approved: Number.parseInt(recipeStats[0].approved) || 0,
          pending: Number.parseInt(recipeStats[0].pending) || 0,
          rejected: Number.parseInt(recipeStats[0].rejected) || 0,
        }
      }

      console.log("✅ [ADMIN-STATS] Recipe statistics fetched:", stats.recipes)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching recipe statistics:", error)
    }

    // Get comment statistics
    console.log("📊 [ADMIN-STATS] Fetching comment statistics...")
    try {
      // Ensure comments table exists
      await sql`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          recipe_id VARCHAR(50) NOT NULL,
          user_id INTEGER NOT NULL,
          username VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          is_flagged BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `

      const commentStats = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_flagged = true THEN 1 END) as flagged
        FROM comments;
      `

      if (commentStats.length > 0) {
        stats.comments = {
          total: Number.parseInt(commentStats[0].total) || 0,
          flagged: Number.parseInt(commentStats[0].flagged) || 0,
        }
      }

      console.log("✅ [ADMIN-STATS] Comment statistics fetched:", stats.comments)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching comment statistics:", error)
    }

    // Get rating statistics
    console.log("📊 [ADMIN-STATS] Fetching rating statistics...")
    try {
      // Ensure ratings table exists
      await sql`
        CREATE TABLE IF NOT EXISTS ratings (
          id SERIAL PRIMARY KEY,
          recipe_id VARCHAR(50) NOT NULL,
          user_id INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(recipe_id, user_id)
        );
      `

      const ratingStats = await sql`
        SELECT 
          COUNT(*) as total,
          COALESCE(AVG(rating), 0) as average
        FROM ratings;
      `

      if (ratingStats.length > 0) {
        stats.ratings = {
          total: Number.parseInt(ratingStats[0].total) || 0,
          average: Number.parseFloat(ratingStats[0].average) || 0,
        }
      }

      console.log("✅ [ADMIN-STATS] Rating statistics fetched:", stats.ratings)
    } catch (error) {
      console.error("❌ [ADMIN-STATS] Error fetching rating statistics:", error)
    }

    console.log("🎉 [ADMIN-STATS] All statistics fetched successfully:", stats)

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
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
