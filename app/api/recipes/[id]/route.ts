import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("🔄 [RECIPE-DETAIL-API] Fetching recipe:", id)

    if (!id) {
      return NextResponse.json({ success: false, error: "Recipe ID is required" }, { status: 400 })
    }

    // Get the recipe from database
    const recipes = await sql`
      SELECT 
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, 
        rating, review_count, view_count, moderation_status, is_published,
        ingredients, instructions, tags, created_at, updated_at
      FROM recipes 
      WHERE id = ${id} AND moderation_status = 'approved' AND is_published = true
    `

    if (recipes.length === 0) {
      console.log("❌ [RECIPE-DETAIL-API] Recipe not found or not published:", id)
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = recipes[0]

    // Process the recipe data
    const processedRecipe = {
      ...recipe,
      rating: Number(recipe.rating) || 0,
      review_count: Number(recipe.review_count) || 0,
      view_count: Number(recipe.view_count) || 0,
      prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
      cook_time_minutes: Number(recipe.cook_time_minutes) || 0,
      servings: Number(recipe.servings) || 1,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
      tags: Array.isArray(recipe.tags) ? recipe.tags : [],
    }

    // Update view count
    await sql`
      UPDATE recipes 
      SET view_count = view_count + 1, updated_at = NOW()
      WHERE id = ${id}
    `

    console.log("✅ [RECIPE-DETAIL-API] Recipe found and view count updated:", {
      id: recipe.id,
      title: recipe.title,
      author: recipe.author_username,
      views: recipe.view_count + 1,
    })

    return NextResponse.json({
      success: true,
      recipe: processedRecipe,
    })
  } catch (error) {
    console.error("❌ [RECIPE-DETAIL-API] Error fetching recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
