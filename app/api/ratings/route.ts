import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// POST - Submit a rating
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [RATINGS-API] Rating submission request received")

    // Get user from session
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [RATINGS-API] No authenticated user found")
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [RATINGS-API] User authenticated:", user.username)

    // Parse request body
    const body = await request.json()
    const { recipe_id, rating } = body

    console.log("📝 [RATINGS-API] Rating data received:", { recipe_id, rating, user_id: user.id })

    // Validate input
    if (!recipe_id || !rating) {
      return NextResponse.json({ success: false, message: "Recipe ID and rating are required" }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "Rating must be between 1 and 5" }, { status: 400 })
    }

    // Check if recipe exists
    const recipeCheck = await sql`
      SELECT id FROM recipes WHERE id = ${recipe_id} AND moderation_status = 'approved' AND is_published = true
    `

    if (recipeCheck.length === 0) {
      return NextResponse.json({ success: false, message: "Recipe not found or not published" }, { status: 404 })
    }

    // Create ratings table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        recipe_id VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(recipe_id, user_id)
      );
    `

    // Insert or update rating
    await sql`
      INSERT INTO ratings (recipe_id, user_id, rating, created_at, updated_at)
      VALUES (${recipe_id}, ${user.id}, ${rating}, NOW(), NOW())
      ON CONFLICT (recipe_id, user_id)
      DO UPDATE SET rating = ${rating}, updated_at = NOW()
    `

    console.log("✅ [RATINGS-API] Rating saved successfully")

    // Calculate new average rating and review count
    const ratingStats = await sql`
      SELECT 
        AVG(rating)::NUMERIC(3,2) as avg_rating,
        COUNT(*)::INTEGER as review_count
      FROM ratings 
      WHERE recipe_id = ${recipe_id}
    `

    const newAverageRating = Number(ratingStats[0].avg_rating) || 0
    const newReviewCount = Number(ratingStats[0].review_count) || 0

    console.log("📊 [RATINGS-API] New rating stats:", { newAverageRating, newReviewCount })

    // Update recipe with new rating stats
    await sql`
      UPDATE recipes 
      SET rating = ${newAverageRating}, review_count = ${newReviewCount}, updated_at = NOW()
      WHERE id = ${recipe_id}
    `

    console.log("✅ [RATINGS-API] Recipe rating stats updated")

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      newAverageRating,
      newReviewCount,
      userRating: rating,
    })
  } catch (error) {
    console.error("❌ [RATINGS-API] Error submitting rating:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
