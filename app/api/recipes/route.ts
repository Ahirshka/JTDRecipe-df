import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { createRecipe, getAllRecipes } from "@/lib/neon"

export async function GET() {
  try {
    console.log("🔄 [RECIPES] Fetching all recipes")

    const recipes = await getAllRecipes()

    console.log("✅ [RECIPES] Recipes retrieved", { count: recipes.length })

    return NextResponse.json({
      success: true,
      recipes,
      count: recipes.length,
    })
  } catch (error) {
    console.error("❌ [RECIPES] Error fetching recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES] Processing new recipe submission")

    // Get authenticated user
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [RECIPES] Unauthorized recipe submission attempt")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    console.log("✅ [RECIPES] User authenticated for recipe submission", {
      userId: user.id,
      username: user.username,
    })

    const body = await request.json()
    console.log("📝 [RECIPES] Request body:", body)

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
    } = body

    // Validate required fields
    if (!title || !category || !difficulty || !ingredients || !instructions) {
      console.log("❌ [RECIPES] Missing required fields", {
        hasTitle: !!title,
        hasCategory: !!category,
        hasDifficulty: !!difficulty,
        hasIngredients: !!ingredients,
        hasInstructions: !!instructions,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Process ingredients and instructions
    let ingredientsList: string[] = []
    let instructionsList: string[] = []

    if (Array.isArray(ingredients)) {
      ingredientsList = ingredients.filter((item: string) => item.trim())
    } else if (typeof ingredients === "string") {
      ingredientsList = ingredients.split("\n").filter((item: string) => item.trim())
    }

    if (Array.isArray(instructions)) {
      instructionsList = instructions.filter((item: string) => item.trim())
    } else if (typeof instructions === "string") {
      instructionsList = instructions.split("\n").filter((item: string) => item.trim())
    }

    console.log("📋 [RECIPES] Processing recipe data", {
      title,
      category,
      difficulty,
      ingredientsCount: ingredientsList.length,
      instructionsCount: instructionsList.length,
    })

    // Create recipe data
    const recipeData = {
      title: title.trim(),
      description: description?.trim() || "",
      ingredients: ingredientsList,
      instructions: instructionsList,
      prep_time: Number.parseInt(prep_time_minutes) || 0,
      cook_time: Number.parseInt(cook_time_minutes) || 0,
      servings: Number.parseInt(servings) || 1,
      difficulty: difficulty.trim(),
      category: category.trim(),
      tags: [], // Default empty tags
      image_url: image_url || null,
      author_id: user.id,
    }

    console.log("💾 [RECIPES] Creating recipe in database", {
      authorId: recipeData.author_id,
      title: recipeData.title,
    })

    const recipe = await createRecipe(recipeData)

    console.log("✅ [RECIPES] Recipe created successfully", {
      recipeId: recipe.id,
      title: recipe.title,
      author: recipe.author_name,
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully",
      recipe: {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_name,
        status: recipe.status,
        created_at: recipe.created_at,
      },
    })
  } catch (error) {
    console.error("❌ [RECIPES] Error creating recipe:", error)
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
