import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// GET - Fetch published recipes
export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES-API] Fetching recipes")

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""

    console.log("📋 [RECIPES-API] Query parameters:", { limit, search, category })

    // Build the query - only get approved and published recipes
    let query = `
      SELECT 
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, 
        rating, review_count, view_count, moderation_status, is_published,
        created_at, updated_at
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (category) {
      query += ` AND category = $${paramIndex}`
      queryParams.push(category)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`
    queryParams.push(limit)

    console.log("🔍 [RECIPES-API] Executing query:", query)
    console.log("📋 [RECIPES-API] Query params:", queryParams)

    // Execute the query
    const recipes = await sql.unsafe(query, queryParams)

    console.log(`✅ [RECIPES-API] Found ${recipes.length} recipes`)

    // Log each recipe for debugging
    recipes.forEach((recipe: any, index: number) => {
      console.log(`📋 [RECIPES-API] Recipe ${index + 1}:`, {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        status: recipe.moderation_status,
        published: recipe.is_published,
        created: recipe.created_at,
        updated: recipe.updated_at,
      })
    })

    // Process recipes to ensure proper data format
    const processedRecipes = recipes.map((recipe: any) => ({
      ...recipe,
      rating: Number(recipe.rating) || 0,
      review_count: Number(recipe.review_count) || 0,
      view_count: Number(recipe.view_count) || 0,
      prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
      cook_time_minutes: Number(recipe.cook_time_minutes) || 0,
      servings: Number(recipe.servings) || 1,
    }))

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
      count: processedRecipes.length,
    })
  } catch (error) {
    console.error("❌ [RECIPES-API] Error fetching recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        recipes: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}

// POST - Create new recipe
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES-API] Creating new recipe")

    // Get user from session
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [RECIPES-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [RECIPES-API] User authenticated:", user.username)

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
      image_url,
      tags,
    } = body

    console.log("📝 [RECIPES-API] Recipe data received:", {
      title,
      category,
      difficulty,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      ingredientsCount: ingredients?.length || 0,
      instructionsCount: instructions?.length || 0,
    })

    // Validate required fields - allow empty arrays for testing
    if (!title || !category || !difficulty) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, category, difficulty" },
        { status: 400 },
      )
    }

    // Generate unique recipe ID
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Prepare ingredients and instructions - handle empty arrays
    const processedIngredients = Array.isArray(ingredients) ? ingredients.filter((i) => i && i.trim()) : []
    const processedInstructions = Array.isArray(instructions) ? instructions.filter((i) => i && i.trim()) : []
    const processedTags = Array.isArray(tags) ? tags.filter((t) => t && t.trim()) : []

    // If arrays are empty, add placeholder content for testing
    if (processedIngredients.length === 0) {
      processedIngredients.push("No ingredients specified")
    }
    if (processedInstructions.length === 0) {
      processedInstructions.push("No instructions specified")
    }

    console.log("📝 [RECIPES-API] Processed data:", {
      recipeId,
      ingredientsCount: processedIngredients.length,
      instructionsCount: processedInstructions.length,
      tagsCount: processedTags.length,
    })

    // Insert recipe into database
    const result = await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, ingredients, 
        instructions, tags, moderation_status, is_published, rating, review_count, 
        view_count, created_at, updated_at
      )
      VALUES (
        ${recipeId}, ${title}, ${description || ""}, ${user.id}, ${user.username},
        ${category}, ${difficulty}, ${prep_time_minutes || 0}, ${cook_time_minutes || 0},
        ${servings || 1}, ${image_url || ""}, ${JSON.stringify(processedIngredients)}::jsonb,
        ${JSON.stringify(processedInstructions)}::jsonb, ${JSON.stringify(processedTags)}::jsonb,
        'pending', false, 0, 0, 0, NOW(), NOW()
      )
      RETURNING id, title, moderation_status, created_at
    `

    if (result.length === 0) {
      console.log("❌ [RECIPES-API] Failed to create recipe")
      return NextResponse.json({ success: false, error: "Failed to create recipe" }, { status: 500 })
    }

    const newRecipe = result[0]
    console.log("✅ [RECIPES-API] Recipe created successfully:", {
      id: newRecipe.id,
      title: newRecipe.title,
      status: newRecipe.moderation_status,
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipeId: newRecipe.id,
      recipe: newRecipe,
    })
  } catch (error) {
    console.error("❌ [RECIPES-API] Error creating recipe:", error)
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
