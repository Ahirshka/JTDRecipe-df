import { type NextRequest, NextResponse } from "next/server"
import { findSessionByToken, findUserById, createRecipe } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Recipe submission started")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("auth_session")?.value
    console.log("🔍 [API] Auth session token:", sessionToken ? `${sessionToken.substring(0, 10)}...` : "Not found")

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

    // Parse request body with proper error handling
    let body
    try {
      const rawBody = await request.text()
      console.log("📝 [API] Raw request body:", rawBody.substring(0, 200) + "...")

      if (!rawBody.trim()) {
        throw new Error("Empty request body")
      }

      body = JSON.parse(rawBody)
      console.log("📝 [API] Parsed request body:", {
        title: body.title,
        category: body.category,
        difficulty: body.difficulty,
        ingredientsCount: Array.isArray(body.ingredients) ? body.ingredients.length : 0,
        instructionsCount: Array.isArray(body.instructions) ? body.instructions.length : 0,
        tagsCount: Array.isArray(body.tags) ? body.tags.length : 0,
      })
    } catch (parseError) {
      console.error("❌ [API] JSON parsing error:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : "Unknown parsing error",
        },
        { status: 400 },
      )
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

    const missingFields = requiredFields.filter((field) => {
      const value = body[field]
      if (field === "ingredients" || field === "instructions") {
        return !Array.isArray(value) || value.length === 0
      }
      return !value && value !== 0
    })

    if (missingFields.length > 0) {
      console.log("❌ [API] Missing required fields:", missingFields)
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
          received: Object.keys(body),
        },
        { status: 400 },
      )
    }

    // Validate and process arrays
    if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      console.log("❌ [API] Invalid ingredients array")
      return NextResponse.json(
        {
          success: false,
          error: "Ingredients must be a non-empty array",
          received: typeof body.ingredients,
        },
        { status: 400 },
      )
    }

    if (!Array.isArray(body.instructions) || body.instructions.length === 0) {
      console.log("❌ [API] Invalid instructions array")
      return NextResponse.json(
        {
          success: false,
          error: "Instructions must be a non-empty array",
          received: typeof body.instructions,
        },
        { status: 400 },
      )
    }

    // Process arrays to remove empty items and ensure strings
    const processedIngredients = body.ingredients
      .filter((item: any) => item && typeof item === "string" && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedInstructions = body.instructions
      .filter((item: any) => item && typeof item === "string" && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedTags = Array.isArray(body.tags)
      ? body.tags
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
    const prepTime = Number.parseInt(body.prep_time_minutes)
    const cookTime = Number.parseInt(body.cook_time_minutes)
    const servings = Number.parseInt(body.servings)

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

    if (isNaN(servings) || servings < 1) {
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
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : null,
      author_id: user.id,
      author_username: user.username,
      category: String(body.category).trim(),
      difficulty: String(body.difficulty).trim(),
      prep_time_minutes: prepTime,
      cook_time_minutes: cookTime,
      servings: servings,
      image_url: body.image_url ? String(body.image_url).trim() : null,
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
      has_description: !!recipeData.description,
      has_image: !!recipeData.image_url,
    })

    // Create recipe in database
    const result = await createRecipe(recipeData)

    if (!result || !result.success) {
      console.log("❌ [API] Failed to create recipe in database:", result)
      return NextResponse.json(
        {
          success: false,
          error: result?.error || "Failed to create recipe in database",
          details: result,
        },
        { status: 500 },
      )
    }

    console.log("✅ [API] Recipe created successfully:", result.recipeId)

    // Return success response matching expected format
    const successResponse = {
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipeId: result.recipeId,
      data: {
        id: result.recipeId,
        title: recipeData.title,
        author: recipeData.author_username,
        status: "pending_moderation",
        created_at: new Date().toISOString(),
      },
    }

    console.log("📤 [API] Sending success response:", successResponse)
    return NextResponse.json(successResponse)
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

export async function GET(request: NextRequest) {
  console.log("🔄 [API] Getting recipes")

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "20"), 100) // Cap at 100
    const offset = Math.max(Number.parseInt(searchParams.get("offset") || "0"), 0) // Ensure non-negative

    console.log("📋 [API] Query params:", { limit, offset })

    // Get recipes from database
    const { getRecipes } = await import("@/lib/neon")
    const recipes = await getRecipes(limit, offset)

    console.log(`✅ [API] Retrieved ${recipes.length} recipes`)

    const response = {
      success: true,
      data: recipes,
      pagination: {
        limit,
        offset,
        count: recipes.length,
        hasMore: recipes.length === limit,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [API] Get recipes error:", error)

    const errorResponse = {
      success: false,
      error: `Failed to get recipes: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
