import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { createRecipe, getAllRecipes } from "@/lib/neon"

export async function GET() {
  try {
    console.log("🔍 [RECIPES-GET] Fetching all recipes")

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

    // Get current user
    const user = await getCurrentUser()

    if (!user) {
      console.log("❌ [RECIPES-POST] No authenticated user found")
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "Please log in to submit recipes",
          debug: "No user found in getCurrentUser()",
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
      return NextResponse.json({ error: "Account not active" }, { status: 403 })
    }

    const body = await request.json()
    console.log("🔍 [RECIPES-POST] Request body received:", Object.keys(body))

    const {
      title,
      description,
      category,
      difficulty,
      prepTime,
      cookTime,
      servings,
      ingredients,
      instructions,
      imageUrl,
    } = body

    // Validate required fields
    if (!title || !category || !difficulty || !ingredients || !instructions) {
      console.log("❌ [RECIPES-POST] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Process ingredients and instructions
    let processedIngredients: string[]
    let processedInstructions: string[]

    try {
      // Handle ingredients - can be string or array
      if (typeof ingredients === "string") {
        processedIngredients = ingredients
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      } else if (Array.isArray(ingredients)) {
        processedIngredients = ingredients.filter((item) => item && item.trim().length > 0)
      } else {
        throw new Error("Invalid ingredients format")
      }

      // Handle instructions - can be string or array
      if (typeof instructions === "string") {
        processedInstructions = instructions
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      } else if (Array.isArray(instructions)) {
        processedInstructions = instructions.filter((item) => item && item.trim().length > 0)
      } else {
        throw new Error("Invalid instructions format")
      }

      console.log("✅ [RECIPES-POST] Processed ingredients:", processedIngredients.length)
      console.log("✅ [RECIPES-POST] Processed instructions:", processedInstructions.length)
    } catch (error) {
      console.error("❌ [RECIPES-POST] Error processing ingredients/instructions:", error)
      return NextResponse.json({ error: "Invalid ingredients or instructions format" }, { status: 400 })
    }

    // Create recipe data
    const recipeData = {
      title: title.trim(),
      description: description?.trim() || "",
      author_id: user.id,
      author_username: user.username,
      category: category.trim(),
      difficulty: difficulty.trim(),
      prep_time_minutes: Number.parseInt(prepTime) || 0,
      cook_time_minutes: Number.parseInt(cookTime) || 0,
      servings: Number.parseInt(servings) || 1,
      ingredients: processedIngredients,
      instructions: processedInstructions,
      image_url: imageUrl?.trim() || null,
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
        error: "Failed to create recipe",
        message: "An error occurred while submitting your recipe",
        debug: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
