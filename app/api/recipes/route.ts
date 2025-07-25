import { type NextRequest, NextResponse } from "next/server"
import { findSessionByToken, findUserById, createRecipe } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Recipe submission started")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [API] Session token:", sessionToken ? `${sessionToken.substring(0, 10)}...` : "Not found")

    if (!sessionToken) {
      console.log("❌ [API] No session token provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session
    const session = await findSessionByToken(sessionToken)
    if (!session) {
      console.log("❌ [API] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    // Get user details
    const user = await findUserById(session.user_id)
    if (!user) {
      console.log("❌ [API] User not found for session")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 401 })
    }

    console.log("✅ [API] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("📝 [API] Request body received:", {
        title: body.title,
        category: body.category,
        difficulty: body.difficulty,
        ingredientsCount: Array.isArray(body.ingredients) ? body.ingredients.length : 0,
        instructionsCount: Array.isArray(body.instructions) ? body.instructions.length : 0,
        tagsCount: Array.isArray(body.tags) ? body.tags.length : 0,
      })
    } catch (error) {
      console.log("❌ [API] Invalid JSON in request body")
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate required fields
    const requiredFields = [
      "title",
      "category",
      "difficulty",
      "prep_time_minutes",
      "cook_time_minutes",
      "servings",
      "ingredients",
      "instructions",
    ]

    const missingFields = requiredFields.filter((field) => !body[field])
    if (missingFields.length > 0) {
      console.log("❌ [API] Missing required fields:", missingFields)
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      )
    }

    // Validate arrays
    if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      console.log("❌ [API] Invalid ingredients array")
      return NextResponse.json({ success: false, error: "Ingredients must be a non-empty array" }, { status: 400 })
    }

    if (!Array.isArray(body.instructions) || body.instructions.length === 0) {
      console.log("❌ [API] Invalid instructions array")
      return NextResponse.json({ success: false, error: "Instructions must be a non-empty array" }, { status: 400 })
    }

    // Process arrays to remove empty items
    const processedIngredients = body.ingredients
      .filter((item: string) => item && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedInstructions = body.instructions
      .filter((item: string) => item && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedTags = Array.isArray(body.tags)
      ? body.tags.filter((item: string) => item && item.trim().length > 0).map((item: string) => item.trim())
      : []

    console.log("🔄 [API] Processed arrays:", {
      ingredients: processedIngredients.length,
      instructions: processedInstructions.length,
      tags: processedTags.length,
    })

    // Prepare recipe data
    const recipeData = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      author_id: user.id,
      author_username: user.username,
      category: body.category.trim(),
      difficulty: body.difficulty.trim(),
      prep_time_minutes: Number.parseInt(body.prep_time_minutes),
      cook_time_minutes: Number.parseInt(body.cook_time_minutes),
      servings: Number.parseInt(body.servings),
      image_url: body.image_url?.trim() || null,
      ingredients: processedIngredients,
      instructions: processedInstructions,
      tags: processedTags,
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
    })

    // Create recipe in database
    const result = await createRecipe(recipeData)

    if (!result || !result.success) {
      console.log("❌ [API] Failed to create recipe in database")
      return NextResponse.json(
        {
          success: false,
          error: result?.error || "Failed to create recipe in database",
        },
        { status: 500 },
      )
    }

    console.log("✅ [API] Recipe created successfully:", result.recipeId)

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipeId: result.recipeId,
      data: {
        title: recipeData.title,
        author: recipeData.author_username,
        status: "pending_moderation",
      },
    })
  } catch (error) {
    console.error("❌ [API] Recipe submission error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  console.log("🔄 [API] Getting recipes")

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("📋 [API] Query params:", { limit, offset })

    // Get recipes from database
    const { getRecipes } = await import("@/lib/neon")
    const recipes = await getRecipes(limit, offset)

    console.log(`✅ [API] Retrieved ${recipes.length} recipes`)

    return NextResponse.json({
      success: true,
      data: recipes,
      pagination: {
        limit,
        offset,
        count: recipes.length,
      },
    })
  } catch (error) {
    console.error("❌ [API] Get recipes error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get recipes: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    )
  }
}
