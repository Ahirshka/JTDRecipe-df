import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { createRecipe, getAllRecipes, initializeDatabase } from "@/lib/neon"

export async function GET() {
  try {
    console.log("🔍 [RECIPES-GET] Fetching all recipes")
    await initializeDatabase()

    const recipes = await getAllRecipes()

    console.log("✅ [RECIPES-GET] Found recipes:", recipes.length)

    return NextResponse.json({
      success: true,
      recipes,
    })
  } catch (error) {
    console.error("❌ [RECIPES-GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [RECIPES-POST] Processing recipe submission")
    await initializeDatabase()

    // Debug: Log request headers and cookies
    console.log("📋 [RECIPES-POST] Request headers:", Object.fromEntries(request.headers.entries()))
    console.log(
      "🍪 [RECIPES-POST] Request cookies:",
      request.cookies.getAll().map((c) => ({ name: c.name, hasValue: !!c.value })),
    )

    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ [RECIPES-POST] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required. Please log in to submit recipes.",
          debug: {
            cookiesReceived: request.cookies.getAll().length,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 },
      )
    }

    console.log("✅ [RECIPES-POST] Authenticated user:", {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    })

    if (user.status !== "active") {
      console.log("❌ [RECIPES-POST] User account not active:", user.status)
      return NextResponse.json(
        {
          success: false,
          error: "Your account is not active. Please contact support.",
        },
        { status: 403 },
      )
    }

    // Parse request body
    const body = await request.json()
    console.log("📝 [RECIPES-POST] Request body received:", {
      title: body.title,
      category: body.category,
      difficulty: body.difficulty,
      hasIngredients: !!body.ingredients,
      hasInstructions: !!body.instructions,
    })

    // Validate required fields
    const requiredFields = ["title", "category", "difficulty", "ingredients", "instructions"]
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`❌ [RECIPES-POST] Missing required field: ${field}`)
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        )
      }
    }

    // Process ingredients and instructions
    let processedIngredients: string[] = []
    let processedInstructions: string[] = []

    try {
      // Handle ingredients - can be string or array
      if (typeof body.ingredients === "string") {
        processedIngredients = body.ingredients
          .split("\n")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
      } else if (Array.isArray(body.ingredients)) {
        processedIngredients = body.ingredients
          .map((item: any) => {
            if (typeof item === "string") return item.trim()
            if (typeof item === "object" && item.ingredient) return item.ingredient.trim()
            return null
          })
          .filter(Boolean)
      } else {
        throw new Error("Invalid ingredients format")
      }

      // Handle instructions - can be string or array
      if (typeof body.instructions === "string") {
        processedInstructions = body.instructions
          .split("\n")
          .map((item: string) => item.trim())
          .filter((item: string) => item.length > 0)
      } else if (Array.isArray(body.instructions)) {
        processedInstructions = body.instructions
          .map((item: any) => {
            if (typeof item === "string") return item.trim()
            if (typeof item === "object" && item.instruction) return item.instruction.trim()
            return null
          })
          .filter(Boolean)
      } else {
        throw new Error("Invalid instructions format")
      }

      console.log("✅ [RECIPES-POST] Processed ingredients:", processedIngredients.length)
      console.log("✅ [RECIPES-POST] Processed instructions:", processedInstructions.length)
    } catch (error) {
      console.error("❌ [RECIPES-POST] Error processing ingredients/instructions:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ingredients or instructions format",
        },
        { status: 400 },
      )
    }

    // Validate arrays
    if (processedIngredients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one ingredient is required",
        },
        { status: 400 },
      )
    }

    if (processedInstructions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one instruction is required",
        },
        { status: 400 },
      )
    }

    // Create recipe data
    const recipeData = {
      title: body.title.trim(),
      description: body.description?.trim() || "",
      author_id: user.id,
      author_username: user.username,
      category: body.category.trim(),
      difficulty: body.difficulty.trim(),
      prep_time_minutes: Number(body.prep_time_minutes || body.prepTime) || 0,
      cook_time_minutes: Number(body.cook_time_minutes || body.cookTime) || 0,
      servings: Number(body.servings) || 1,
      ingredients: processedIngredients,
      instructions: processedInstructions,
      image_url: body.image_url || body.imageUrl || null,
    }

    console.log("🔍 [RECIPES-POST] Creating recipe with data:", {
      title: recipeData.title,
      author_id: recipeData.author_id,
      author_username: recipeData.author_username,
      category: recipeData.category,
      difficulty: recipeData.difficulty,
      ingredientsCount: recipeData.ingredients.length,
      instructionsCount: recipeData.instructions.length,
    })

    // Create the recipe
    const recipe = await createRecipe(recipeData)

    console.log("✅ [RECIPES-POST] Recipe created successfully:", recipe.id)

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending review",
      recipe: {
        id: recipe.id,
        title: recipe.title,
        status: "pending",
      },
    })
  } catch (error) {
    console.error("❌ [RECIPES-POST] Error creating recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create recipe",
        message: "An error occurred while submitting your recipe",
        debug: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
