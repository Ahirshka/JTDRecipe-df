import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { createRecipe, getAllRecipes } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [RECIPE-API] POST request received")

  try {
    // Get current user with detailed logging
    console.log("🔄 [RECIPE-API] Attempting to get current user...")

    let user
    try {
      user = await getCurrentUserFromRequest(request)
      console.log("✅ [RECIPE-API] User lookup completed:", user ? "User found" : "No user")
    } catch (authError) {
      console.error("❌ [RECIPE-API] Authentication error:", authError)
      return NextResponse.json(
        {
          success: false,
          error: "Authentication error",
          details: authError instanceof Error ? authError.message : "Failed to authenticate user",
        },
        { status: 500 },
      )
    }

    if (!user) {
      console.log("❌ [RECIPE-API] User not authenticated - no user object returned")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          details: "User must be logged in to submit recipes. Please log in and try again.",
        },
        { status: 401 },
      )
    }

    console.log("✅ [RECIPE-API] User authenticated successfully:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    // Check if user account is active
    if (user.status !== "active") {
      console.log("❌ [RECIPE-API] User account not active:", user.status)
      return NextResponse.json(
        {
          success: false,
          error: "Account not active",
          details: `Your account status is: ${user.status}. Please contact support if you believe this is an error.`,
        },
        { status: 403 },
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log("✅ [RECIPE-API] Request body parsed successfully")
      console.log("📝 [RECIPE-API] Request body structure:", {
        title: typeof body.title,
        ingredients: Array.isArray(body.ingredients) ? `Array[${body.ingredients.length}]` : typeof body.ingredients,
        instructions: Array.isArray(body.instructions)
          ? `Array[${body.instructions.length}]`
          : typeof body.instructions,
        tags: Array.isArray(body.tags) ? `Array[${body.tags.length}]` : typeof body.tags,
        prep_time_minutes: typeof body.prep_time_minutes,
        cook_time_minutes: typeof body.cook_time_minutes,
        servings: typeof body.servings,
      })
    } catch (parseError) {
      console.error("❌ [RECIPE-API] Failed to parse request body:", parseError)
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
    const requiredFields = ["title", "category", "difficulty", "prep_time_minutes", "cook_time_minutes", "servings"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      console.log("❌ [RECIPE-API] Missing required fields:", missingFields)
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: `Required fields missing: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 },
      )
    }

    // Validate ingredients - MUST be array for JSONB
    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      console.log("❌ [RECIPE-API] Invalid ingredients format:", {
        type: typeof body.ingredients,
        isArray: Array.isArray(body.ingredients),
        value: body.ingredients,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ingredients format",
          details: "Ingredients must be a non-empty array of strings for JSONB storage",
          expected: "ingredients: ['2 cups flour', '1 cup sugar', '3 eggs']",
          received: {
            type: typeof body.ingredients,
            isArray: Array.isArray(body.ingredients),
            length: Array.isArray(body.ingredients) ? body.ingredients.length : "N/A",
          },
        },
        { status: 400 },
      )
    }

    // Validate instructions - MUST be array for JSONB
    if (!body.instructions || !Array.isArray(body.instructions) || body.instructions.length === 0) {
      console.log("❌ [RECIPE-API] Invalid instructions format:", {
        type: typeof body.instructions,
        isArray: Array.isArray(body.instructions),
        value: body.instructions,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Invalid instructions format",
          details: "Instructions must be a non-empty array of strings for JSONB storage",
          expected: "instructions: ['Mix ingredients', 'Bake for 30 minutes', 'Serve hot']",
          received: {
            type: typeof body.instructions,
            isArray: Array.isArray(body.instructions),
            length: Array.isArray(body.instructions) ? body.instructions.length : "N/A",
          },
        },
        { status: 400 },
      )
    }

    // Process and validate ingredients array
    const processedIngredients = body.ingredients
      .map((ingredient: any, index: number) => {
        if (typeof ingredient === "string") {
          return ingredient.trim()
        } else {
          console.warn(`⚠️ [RECIPE-API] Non-string ingredient at index ${index}:`, ingredient)
          return String(ingredient).trim()
        }
      })
      .filter((ing: string) => ing && ing.length > 0)

    // Process and validate instructions array
    const processedInstructions = body.instructions
      .map((instruction: any, index: number) => {
        if (typeof instruction === "string") {
          return instruction.trim()
        } else {
          console.warn(`⚠️ [RECIPE-API] Non-string instruction at index ${index}:`, instruction)
          return String(instruction).trim()
        }
      })
      .filter((inst: string) => inst && inst.length > 0)

    // Process tags array (optional)
    const processedTags = Array.isArray(body.tags)
      ? body.tags
          .map((tag: any) => (typeof tag === "string" ? tag.trim() : String(tag).trim()))
          .filter((tag: string) => tag && tag.length > 0)
      : []

    // Prepare recipe data for JSONB storage
    const recipeData = {
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : "",
      ingredients: processedIngredients, // Array of strings for JSONB
      instructions: processedInstructions, // Array of strings for JSONB
      prep_time: Number.parseInt(body.prep_time_minutes) || 0,
      cook_time: Number.parseInt(body.cook_time_minutes) || 0,
      servings: Number.parseInt(body.servings) || 1,
      difficulty: String(body.difficulty).trim(),
      category: String(body.category).trim(),
      tags: processedTags, // Array of strings for JSONB
      image_url: body.image_url ? String(body.image_url).trim() : undefined,
      author_id: user.id,
    }

    console.log("📝 [RECIPE-API] Processed recipe data for JSONB:", {
      title: recipeData.title,
      ingredients_type: typeof recipeData.ingredients,
      ingredients_isArray: Array.isArray(recipeData.ingredients),
      ingredients_count: recipeData.ingredients.length,
      ingredients_sample: recipeData.ingredients.slice(0, 2),
      instructions_type: typeof recipeData.instructions,
      instructions_isArray: Array.isArray(recipeData.instructions),
      instructions_count: recipeData.instructions.length,
      instructions_sample: recipeData.instructions.slice(0, 2),
      tags_type: typeof recipeData.tags,
      tags_isArray: Array.isArray(recipeData.tags),
      tags_count: recipeData.tags.length,
      author_id: recipeData.author_id,
    })

    // Final validation after processing
    if (recipeData.ingredients.length === 0) {
      console.log("❌ [RECIPE-API] No valid ingredients after processing")
      return NextResponse.json(
        {
          success: false,
          error: "No valid ingredients",
          details: "At least one valid ingredient is required after processing",
        },
        { status: 400 },
      )
    }

    if (recipeData.instructions.length === 0) {
      console.log("❌ [RECIPE-API] No valid instructions after processing")
      return NextResponse.json(
        {
          success: false,
          error: "No valid instructions",
          details: "At least one valid instruction is required after processing",
        },
        { status: 400 },
      )
    }

    // Create recipe in database with JSONB arrays
    let createdRecipe
    try {
      console.log("💾 [RECIPE-API] Creating recipe in database with JSONB arrays...")
      createdRecipe = await createRecipe(recipeData)
      console.log("✅ [RECIPE-API] Recipe created successfully:", {
        id: createdRecipe.id,
        title: createdRecipe.title,
        status: createdRecipe.status,
        author_id: createdRecipe.author_id,
        ingredients_stored: Array.isArray(createdRecipe.ingredients) ? "JSONB Array" : typeof createdRecipe.ingredients,
        instructions_stored: Array.isArray(createdRecipe.instructions)
          ? "JSONB Array"
          : typeof createdRecipe.instructions,
      })
    } catch (dbError) {
      console.error("❌ [RECIPE-API] Database error creating recipe:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database error",
          details: dbError instanceof Error ? dbError.message : "Failed to save recipe to database",
          debug: {
            ingredients_format: typeof recipeData.ingredients,
            instructions_format: typeof recipeData.instructions,
            expected_format: "Array of strings for JSONB storage",
          },
        },
        { status: 500 },
      )
    }

    // Return success response
    const response = {
      success: true,
      message: "Recipe submitted successfully for moderation",
      data: {
        recipe: {
          id: createdRecipe.id,
          title: createdRecipe.title,
          status: createdRecipe.status,
          author_name: createdRecipe.author_name,
          created_at: createdRecipe.created_at,
          ingredients_count: Array.isArray(createdRecipe.ingredients) ? createdRecipe.ingredients.length : 0,
          instructions_count: Array.isArray(createdRecipe.instructions) ? createdRecipe.instructions.length : 0,
          storage_format: "JSONB Arrays",
        },
      },
    }

    console.log("✅ [RECIPE-API] Sending success response:", response)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("❌ [RECIPE-API] Unexpected error:", error)

    // Detailed error response
    const errorResponse = {
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      timestamp: new Date().toISOString(),
    }

    console.log("❌ [RECIPE-API] Sending error response:", errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  console.log("🔄 [RECIPE-API] GET request received")

  try {
    // Get all approved recipes
    console.log("📖 [RECIPE-API] Fetching all recipes...")
    const recipes = await getAllRecipes()

    console.log("✅ [RECIPE-API] Retrieved recipes:", {
      count: recipes.length,
      sample: recipes.slice(0, 3).map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        ingredients_format: Array.isArray(r.ingredients) ? "JSONB Array" : typeof r.ingredients,
        instructions_format: Array.isArray(r.instructions) ? "JSONB Array" : typeof r.instructions,
      })),
    })

    const response = {
      success: true,
      data: {
        recipes,
        count: recipes.length,
        storage_format: "JSONB Arrays",
      },
    }

    console.log("✅ [RECIPE-API] Sending GET response with", recipes.length, "recipes")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [RECIPE-API] Error fetching recipes:", error)

    const errorResponse = {
      success: false,
      error: "Failed to fetch recipes",
      details: error instanceof Error ? error.message : "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    }

    console.log("❌ [RECIPE-API] Sending GET error response:", errorResponse)
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
