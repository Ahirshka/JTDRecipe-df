import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

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

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    // Get user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let userId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const recipeData = await request.json()

    // Validate required fields
    if (!recipeData.title || !recipeData.category || !recipeData.difficulty) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate ingredients and instructions
    if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      return NextResponse.json({ success: false, error: "At least one ingredient is required" }, { status: 400 })
    }

    if (!recipeData.instructions || !Array.isArray(recipeData.instructions) || recipeData.instructions.length === 0) {
      return NextResponse.json({ success: false, error: "At least one instruction is required" }, { status: 400 })
    }

    // Start transaction
    const result = await sql.begin(async (sql) => {
      // Insert main recipe
      const [recipe] = await sql`
        INSERT INTO recipes (
          title, description, author_id, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, image_url,
          moderation_status, is_published, created_at, updated_at
        ) VALUES (
          ${recipeData.title}, 
          ${recipeData.description || null}, 
          ${userId},
          ${recipeData.category}, 
          ${recipeData.difficulty}, 
          ${recipeData.prep_time_minutes || 0},
          ${recipeData.cook_time_minutes || 0}, 
          ${recipeData.servings || 1}, 
          ${recipeData.image_url || null},
          'pending', 
          false, 
          NOW(), 
          NOW()
        )
        RETURNING id
      `

      const recipeId = recipe.id

      // Insert ingredients
      for (const ingredient of recipeData.ingredients) {
        if (ingredient.ingredient && ingredient.ingredient.trim()) {
          await sql`
            INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit)
            VALUES (
              ${recipeId}, 
              ${ingredient.ingredient.trim()}, 
              ${ingredient.amount || ""}, 
              ${ingredient.unit || ""}
            )
          `
        }
      }

      // Insert instructions
      for (const instruction of recipeData.instructions) {
        if (instruction.instruction && instruction.instruction.trim()) {
          await sql`
            INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
            VALUES (
              ${recipeId}, 
              ${instruction.instruction.trim()}, 
              ${instruction.step_number || 1}
            )
          `
        }
      }

      // Insert tags
      if (recipeData.tags && Array.isArray(recipeData.tags)) {
        for (const tag of recipeData.tags) {
          if (tag && typeof tag === "string" && tag.trim()) {
            await sql`
              INSERT INTO recipe_tags (recipe_id, tag)
              VALUES (${recipeId}, ${tag.trim()})
            `
          }
        }
      }

      return recipeId
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully! It will be reviewed by our moderators before being published.",
      recipeId: result,
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
