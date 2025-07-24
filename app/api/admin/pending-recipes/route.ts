import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import { requireAdmin } from "@/lib/server-auth"

export async function GET() {
  try {
    // Ensure user is admin
    await requireAdmin()

    await initializeDatabase()

    console.log("🔍 Fetching pending recipes for admin review...")

    const recipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        u.email as author_email,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'ingredient', ri.ingredient,
              'amount', ri.amount,
              'unit', ri.unit
            )
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
      WHERE r.moderation_status = 'pending'
      GROUP BY r.id, u.username, u.email
      ORDER BY r.created_at ASC
    `

    const formattedRecipes = recipes.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      author_username: row.author_username,
      author_email: row.author_email,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: 0,
      review_count: 0,
      view_count: 0,
      moderation_status: row.moderation_status,
      moderation_notes: row.moderation_notes,
      is_published: false,
      created_at: row.created_at,
      updated_at: row.updated_at,
      ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
      instructions: Array.isArray(row.instructions) ? row.instructions : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
    }))

    console.log(`✅ Found ${formattedRecipes.length} pending recipes`)

    return NextResponse.json({
      success: true,
      recipes: formattedRecipes,
      count: formattedRecipes.length,
    })
  } catch (error) {
    console.error("❌ Failed to get pending recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get pending recipes",
        details: error instanceof Error ? error.message : "Access denied",
        recipes: [],
        count: 0,
      },
      { status: error.message === "Admin access required" ? 403 : 500 },
    )
  }
}
