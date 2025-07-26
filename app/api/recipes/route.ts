import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// GET - Fetch published recipes
export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES-API] Getting published recipes")

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    console.log("📋 [RECIPES-API] Query parameters:", { limit, offset, category, search })

    // Build query conditions
    const whereConditions = ["moderation_status = 'approved'", "is_published = true"]
    const queryParams: any[] = []
    let paramIndex = 1

    if (category) {
      whereConditions.push(`category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Add limit and offset
    queryParams.push(limit, offset)

    const whereClause = whereConditions.join(" AND ")
    const query = `
      SELECT 
        r.*,
        u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    console.log("🔍 [RECIPES-API] Executing query:", query)
    console.log("🔍 [RECIPES-API] Query params:", queryParams)

    const result = await sql.unsafe(query, queryParams)

    console.log(`✅ [RECIPES-API] Retrieved ${result.length} published recipes`)

    // Log each recipe for debugging
    result.forEach((recipe, index) => {
      console.log(`📋 [RECIPES-API] Recipe ${index + 1}:`, {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        status: recipe.moderation_status,
        published: recipe.is_published,
      })
    })

    return NextResponse.json({
      success: true,
      recipes: result,
      pagination: {
        limit,
        offset,
        count: result.length,
      },
    })
  } catch (error) {
    console.error("❌ [RECIPES-API] Error getting recipes:", error)
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

// POST - Create new recipe
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES-API] Creating new recipe")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [RECIPES-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [RECIPES-API] User authenticated:", user.username)

    // Parse request body
    const body = await request.json()
    const { title, description, category, difficulty, prepTime, cookTime, servings, ingredients, instructions, tags } =
      body

    console.log("📝 [RECIPES-API] Recipe data received:", {
      title,
      category,
      difficulty,
      prepTime,
      cookTime,
      servings,
      ingredientsCount: ingredients?.length,
      instructionsCount: instructions?.length,
      tagsCount: tags?.length,
    })

    // Validate required fields
    if (!title || !category || !difficulty || !ingredients || !instructions) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, category, difficulty, ingredients, instructions" },
        { status: 400 },
      )
    }

    // Validate arrays
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ success: false, error: "Ingredients must be a non-empty array" }, { status: 400 })
    }

    if (!Array.isArray(instructions) || instructions.length === 0) {
      return NextResponse.json({ success: false, error: "Instructions must be a non-empty array" }, { status: 400 })
    }

    // Generate unique recipe ID
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Prepare data for insertion
    const recipeData = {
      id: recipeId,
      title: title.trim(),
      description: description?.trim() || null,
      author_id: user.id,
      author_username: user.username,
      category: category.trim(),
      difficulty: difficulty.trim(),
      prep_time_minutes: Number.parseInt(prepTime) || 0,
      cook_time_minutes: Number.parseInt(cookTime) || 0,
      servings: Number.parseInt(servings) || 1,
      image_url: null, // TODO: Handle image uploads
      ingredients: JSON.stringify(ingredients.filter((i) => i.trim())),
      instructions: JSON.stringify(instructions.filter((i) => i.trim())),
      tags: JSON.stringify(tags || []),
      moderation_status: "pending",
      is_published: false,
      rating: 0,
      review_count: 0,
      view_count: 0,
    }

    console.log("💾 [RECIPES-API] Inserting recipe into database:", {
      id: recipeData.id,
      title: recipeData.title,
      author: recipeData.author_username,
    })

    // Insert recipe into database
    const result = await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, 
        category, difficulty, prep_time_minutes, cook_time_minutes, 
        servings, image_url, ingredients, instructions, tags,
        moderation_status, is_published, rating, review_count, view_count
      ) VALUES (
        ${recipeData.id}, ${recipeData.title}, ${recipeData.description}, 
        ${recipeData.author_id}, ${recipeData.author_username},
        ${recipeData.category}, ${recipeData.difficulty}, 
        ${recipeData.prep_time_minutes}, ${recipeData.cook_time_minutes}, 
        ${recipeData.servings}, ${recipeData.image_url},
        ${recipeData.ingredients}::jsonb, ${recipeData.instructions}::jsonb, 
        ${recipeData.tags}::jsonb, ${recipeData.moderation_status}, 
        ${recipeData.is_published}, ${recipeData.rating}, 
        ${recipeData.review_count}, ${recipeData.view_count}
      )
      RETURNING id, title, moderation_status, created_at
    `

    if (result.length === 0) {
      throw new Error("Failed to insert recipe - no result returned")
    }

    const insertedRecipe = result[0]
    console.log("✅ [RECIPES-API] Recipe created successfully:", {
      id: insertedRecipe.id,
      title: insertedRecipe.title,
      status: insertedRecipe.moderation_status,
      created_at: insertedRecipe.created_at,
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipeId: insertedRecipe.id,
      recipe: insertedRecipe,
    })
  } catch (error) {
    console.error("❌ [RECIPES-API] Error creating recipe:", error)
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
