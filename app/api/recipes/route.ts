import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const recipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        COALESCE(r.rating, 0) as rating,
        COALESCE(r.review_count, 0) as review_count,
        COALESCE(r.view_count, 0) as view_count
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'approved' 
        AND r.is_published = true
      ORDER BY r.created_at DESC
      LIMIT 50
    `

    const formattedRecipes = recipes.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      author_username: row.author_username,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: Number.parseFloat(row.rating) || 0,
      review_count: Number.parseInt(row.review_count) || 0,
      view_count: Number.parseInt(row.view_count) || 0,
      moderation_status: row.moderation_status,
      is_published: row.is_published,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return NextResponse.json({
      success: true,
      recipes: formattedRecipes,
      count: formattedRecipes.length,
    })
  } catch (error) {
    console.error("Failed to get recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    await initializeDatabase()

    const recipeData = await request.json()

    // Validate required fields
    if (!recipeData.title || !recipeData.category || !recipeData.difficulty) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // For testing purposes, we'll use a default test user
    // In production, you'd get this from the authenticated session
    const testUserId = "test_user_1"

    // Check if test user exists, create if not
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${testUserId}
    `

    if (existingUser.length === 0) {
      await sql`
        INSERT INTO users (id, username, email, password_hash, email_verified, created_at, updated_at)
        VALUES (${testUserId}, 'TestUser', 'test@example.com', 'test_hash', true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `
    }

    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    await sql.begin(async (sql) => {
      // Insert main recipe
      await sql`
        INSERT INTO recipes (
          id, title, description, author_id, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, image_url,
          moderation_status, is_published, created_at, updated_at
        ) VALUES (
          ${recipeId}, ${recipeData.title}, ${recipeData.description || null}, ${testUserId},
          ${recipeData.category}, ${recipeData.difficulty}, ${recipeData.prep_time_minutes || 0},
          ${recipeData.cook_time_minutes || 0}, ${recipeData.servings || 1}, ${recipeData.image_url || null},
          'pending', false, NOW(), NOW()
        )
      `

      // Insert ingredients
      if (recipeData.ingredients && Array.isArray(recipeData.ingredients)) {
        for (const ingredient of recipeData.ingredients) {
          if (ingredient.ingredient && ingredient.amount && ingredient.unit) {
            await sql`
              INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit)
              VALUES (${recipeId}, ${ingredient.ingredient}, ${ingredient.amount}, ${ingredient.unit})
            `
          }
        }
      }

      // Insert instructions
      if (recipeData.instructions && Array.isArray(recipeData.instructions)) {
        for (const instruction of recipeData.instructions) {
          if (instruction.instruction && instruction.step_number) {
            await sql`
              INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
              VALUES (${recipeId}, ${instruction.instruction}, ${instruction.step_number})
            `
          }
        }
      }

      // Insert tags
      if (recipeData.tags && Array.isArray(recipeData.tags)) {
        for (const tag of recipeData.tags) {
          if (tag && typeof tag === "string") {
            await sql`
              INSERT INTO recipe_tags (recipe_id, tag)
              VALUES (${recipeId}, ${tag})
            `
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully",
      recipeId: recipeId,
    })
  } catch (error) {
    console.error("Failed to create recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
