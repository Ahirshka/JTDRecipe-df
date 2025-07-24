import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Get user's rating for a recipe
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let userId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("recipeId")

    if (!recipeId) {
      return NextResponse.json({ success: false, error: "Recipe ID required" }, { status: 400 })
    }

    const rating = await sql`
      SELECT rating FROM ratings 
      WHERE user_id = ${userId} AND recipe_id = ${recipeId}
    `

    return NextResponse.json({
      success: true,
      rating: rating.length > 0 ? rating[0].rating : null,
    })
  } catch (error) {
    console.error("Get rating error:", error)
    return NextResponse.json({ success: false, error: "Failed to get rating" }, { status: 500 })
  }
}

// Submit or update a rating
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let userId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { recipeId, rating } = await request.json()

    if (!recipeId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Valid recipe ID and rating (1-5) required" }, { status: 400 })
    }

    // Insert or update rating
    await sql`
      INSERT INTO ratings (user_id, recipe_id, rating, created_at, updated_at)
      VALUES (${userId}, ${recipeId}, ${rating}, NOW(), NOW())
      ON CONFLICT (user_id, recipe_id) 
      DO UPDATE SET rating = ${rating}, updated_at = NOW()
    `

    // Calculate new average rating for the recipe
    const avgResult = await sql`
      SELECT 
        AVG(rating)::DECIMAL(3,2) as avg_rating,
        COUNT(*) as total_ratings
      FROM ratings 
      WHERE recipe_id = ${recipeId}
    `

    const avgRating = Number.parseFloat(avgResult[0].avg_rating) || 0
    const totalRatings = Number.parseInt(avgResult[0].total_ratings) || 0

    // Update recipe with new average
    await sql`
      UPDATE recipes 
      SET 
        rating = ${avgRating},
        review_count = ${totalRatings},
        updated_at = NOW()
      WHERE id = ${recipeId}
    `

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      avgRating,
      totalRatings,
    })
  } catch (error) {
    console.error("Submit rating error:", error)
    return NextResponse.json({ success: false, error: "Failed to submit rating" }, { status: 500 })
  }
}
