import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initializeDatabase()

    const recipeId = params.id

    const recipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'ingredient', ri.ingredient,
              'amount', ri.amount,
              'unit', ri.unit
            )
            ORDER BY ri.order_index
          ) FILTER (WHERE ri.ingredient IS NOT NULL), 
          '[]'::json
        ) as ingredients,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'instruction', inst.instruction,
              'step_number', inst.step_number
            )
            ORDER BY inst.step_number
          ) FILTER (WHERE inst.instruction IS NOT NULL), 
          '[]'::json
        ) as instructions,
        COALESCE(
          array_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL), 
          ARRAY[]::text[]
        ) as tags
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.id = ${recipeId} 
        AND r.moderation_status = 'approved' 
        AND r.is_published = true
      GROUP BY r.id, u.username
    `

    if (recipes.length === 0) {
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = recipes[0]

    // Increment view count
    await sql`
      UPDATE recipes 
      SET view_count = COALESCE(view_count, 0) + 1 
      WHERE id = ${recipeId}
    `

    return NextResponse.json({
      success: true,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        author_id: recipe.author_id,
        author_username: recipe.author_username,
        category: recipe.category,
        difficulty: recipe.difficulty,
        prep_time_minutes: recipe.prep_time_minutes || 0,
        cook_time_minutes: recipe.cook_time_minutes || 0,
        servings: recipe.servings || 1,
        image_url: recipe.image_url,
        rating: Number.parseFloat(recipe.rating) || 0,
        review_count: recipe.review_count || 0,
        view_count: recipe.view_count || 0,
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        tags: Array.isArray(recipe.tags) ? recipe.tags : [],
        created_at: recipe.created_at,
      },
    })
  } catch (error) {
    console.error("Get recipe error:", error)
    return NextResponse.json({ success: false, error: "Failed to get recipe" }, { status: 500 })
  }
}
