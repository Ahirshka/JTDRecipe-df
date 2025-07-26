import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// GET - Fetch published recipes
export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES-API] Fetching published recipes...")

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    console.log("📋 [RECIPES-API] Query parameters:", { limit, offset, category, search })

    // Build query conditions
    const whereConditions = ["r.moderation_status = 'approved'", "r.is_published = true"]
    const queryParams: any[] = []
    let paramIndex = 1

    if (category) {
      whereConditions.push(`r.category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    if (search) {
      whereConditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Add limit and offset
    queryParams.push(limit, offset)

    const whereClause = whereConditions.join(" AND ")

    console.log("🔍 [RECIPES-API] Query conditions:", whereClause)

    const result = await sql`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.category,
        r.difficulty,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.servings,
        r.ingredients,
        r.instructions,
        r.tags,
        r.image_url,
        r.rating,
        r.review_count,
        r.view_count,
        r.created_at,
        r.updated_at,
        u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE ${sql.raw(whereClause)}
      ORDER BY r.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    console.log(`✅ [RECIPES-API] Found ${result.length} published recipes`)

    const recipes = result.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      author_username: recipe.author_username,
      category: recipe.category,
      difficulty: recipe.difficulty,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: recipe.tags,
      image_url: recipe.image_url,
      rating: recipe.rating,
      review_count: recipe.review_count,
      view_count: recipe.view_count,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
    }))

    return NextResponse.json({
      success: true,
      recipes,
      count: recipes.length,
    })
  } catch (error) {
    console.error("❌ [RECIPES-API] Error fetching recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
        details: error instanceof Error ? error.message : "Unknown error",
        recipes: [],
      },
      { status: 500 },
    )
  }
}

// POST - Create new recipe
export async function POST(request: NextRequest) {
  console.log("🔄 [API] Recipe submission started")

  try {
    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [API] User authenticated:", user.username)

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      category,
      difficulty,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      ingredients,
      instructions,
      tags,
      image_url,
    } = body

    console.log("📝 [API] Recipe data received:", {
      title,
      category,
      difficulty,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      ingredients_count: ingredients?.length,
      instructions_count: instructions?.length,
      tags_count: tags?.length,
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

    // Process arrays to remove empty items and ensure strings
    const processedIngredients = ingredients
      .filter((item: any) => item && typeof item === "string" && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedInstructions = instructions
      .filter((item: any) => item && typeof item === "string" && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedTags = Array.isArray(tags)
      ? tags
          .filter((item: any) => item && typeof item === "string" && item.trim().length > 0)
          .map((item: string) => item.trim())
      : []

    // Validate processed arrays
    if (processedIngredients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one valid ingredient is required",
        },
        { status: 400 },
      )
    }

    if (processedInstructions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one valid instruction is required",
        },
        { status: 400 },
      )
    }

    console.log("🔄 [API] Processed arrays:", {
      ingredients: processedIngredients.length,
      instructions: processedInstructions.length,
      tags: processedTags.length,
    })

    // Validate numeric fields
    const prepTime = Number.parseInt(prep_time_minutes)
    const cookTime = Number.parseInt(cook_time_minutes)
    const servingsCount = Number.parseInt(servings)

    if (isNaN(prepTime) || prepTime < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Prep time must be a valid positive number",
        },
        { status: 400 },
      )
    }

    if (isNaN(cookTime) || cookTime < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cook time must be a valid positive number",
        },
        { status: 400 },
      )
    }

    if (isNaN(servingsCount) || servingsCount < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Servings must be a valid positive number",
        },
        { status: 400 },
      )
    }

    // Prepare recipe data matching database schema exactly
    const recipeData = {
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      author_id: user.id,
      author_username: user.username,
      category: String(category).trim(),
      difficulty: String(difficulty).trim(),
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      servings: servingsCount,
      image_url: image_url ? String(image_url).trim() : null,
      ingredients: processedIngredients,
      instructions: processedInstructions,
      tags: processedTags,
      moderation_status: "pending",
      is_published: false,
      rating: 0,
      review_count: 0,
      view_count: 0,
    }

    console.log("📝 [API] Final recipe data prepared:", {
      title: recipeData.title,
      author: recipeData.author_username,
      category: recipeData.category,
      difficulty: recipeData.difficulty,
      prep_time: recipeData.prep_time_minutes,
      cook_time: recipeData.cook_time_minutes,
      servings: recipeData.servings,
      ingredients_count: recipeData.ingredients.length,
      instructions_count: recipeData.instructions.length,
      tags_count: recipeData.tags.length,
      has_description: !!recipeData.description,
      has_image: !!recipeData.image_url,
    })

    // Create recipe in database
    const result = await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, 
        category, difficulty, prep_time_minutes, cook_time_minutes, 
        servings, image_url, ingredients, instructions, tags,
        moderation_status, is_published, rating, review_count, view_count
      ) VALUES (
        ${recipeData.id}, 
        ${recipeData.title}, 
        ${recipeData.description || null}, 
        ${recipeData.author_id}, 
        ${recipeData.author_username},
        ${recipeData.category}, 
        ${recipeData.difficulty}, 
        ${recipeData.prep_time_minutes || 0}, 
        ${recipeData.cook_time_minutes || 0}, 
        ${recipeData.servings || 1}, 
        ${recipeData.image_url || null},
        ${JSON.stringify(recipeData.ingredients)}::jsonb, 
        ${JSON.stringify(recipeData.instructions)}::jsonb, 
        ${JSON.stringify(recipeData.tags)}::jsonb,
        ${recipeData.moderation_status}, 
        ${recipeData.is_published}, 
        ${recipeData.rating}, 
        ${recipeData.review_count}, 
        ${recipeData.view_count}
      )
      RETURNING id, title, moderation_status, created_at
    `

    if (result.length === 0) {
      throw new Error("Failed to insert recipe")
    }

    const insertedRecipe = result[0]
    console.log("✅ [API] Recipe created successfully:", {
      id: insertedRecipe.id,
      title: insertedRecipe.title,
      status: insertedRecipe.moderation_status,
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipe: {
        id: insertedRecipe.id,
        title: insertedRecipe.title,
        status: insertedRecipe.moderation_status,
        created_at: insertedRecipe.created_at,
      },
    })
  } catch (error) {
    console.error("❌ [API] Recipe submission error:", error)

    // Ensure we always return valid JSON
    const errorResponse = {
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    }

    console.log("📤 [API] Sending error response:", errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
