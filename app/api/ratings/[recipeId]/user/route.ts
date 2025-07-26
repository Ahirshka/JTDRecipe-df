import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// GET - Get user's rating for a specific recipe
export async function GET(request: NextRequest, { params }: { params: { recipeId: string } }) {
  try {
    console.log("🔄 [USER-RATING-API] Fetching user rating for recipe:", params.recipeId)

    // Get user from session
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [USER-RATING-API] No authenticated user found")
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [USER-RATING-API] User authenticated:", user.username)

    // Get user's rating for this recipe
    const userRating = await sql`
      SELECT rating, created_at, updated_at
      FROM ratings 
      WHERE recipe_id = ${params.recipeId} AND user_id = ${user.id}
    `

    if (userRating.length === 0) {
      console.log("📝 [USER-RATING-API] No rating found for user")
      return NextResponse.json({
        success: true,
        rating: null,
        message: "No rating found for this user and recipe",
      })
    }

    const rating = userRating[0]
    console.log("✅ [USER-RATING-API] User rating found:", rating.rating)

    return NextResponse.json({
      success: true,
      rating: {
        rating: Number(rating.rating),
        created_at: rating.created_at,
        updated_at: rating.updated_at,
      },
    })
  } catch (error) {
    console.error("❌ [USER-RATING-API] Error fetching user rating:", error)
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
