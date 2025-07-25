import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { createRecipe, getAllRecipes } from "@/lib/neon"
import { addLog } from "../test/server-logs/route"

export async function GET() {
  try {
    addLog("info", "[RECIPES] Fetching all recipes")

    const recipes = await getAllRecipes()

    addLog("info", "[RECIPES] Recipes retrieved", { count: recipes.length })

    return NextResponse.json({
      success: true,
      recipes,
      count: recipes.length,
    })
  } catch (error) {
    addLog("error", "[RECIPES] Error fetching recipes", { error })
    console.error("❌ [RECIPES] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    addLog("info", "[RECIPES] Processing new recipe submission")

    // Get authenticated user
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      addLog("error", "[RECIPES] Unauthorized recipe submission attempt")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    addLog("info", "[RECIPES] User authenticated for recipe submission", {
      userId: user.id,
      username: user.username,
    })

    const body = await request.json()
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
      addLog("error", "[RECIPES] Missing required fields", {
        hasTitle: !!title,
        hasCategory: !!category,
        hasDifficulty: !!difficulty,
        hasIngredients: !!ingredients,
        hasInstructions: !!instructions,
      })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Process ingredients and instructions
    const ingredientsList = Array.isArray(ingredients)
      ? ingredients
      : ingredients.split("\n").filter((item: string) => item.trim())

    const instructionsList = Array.isArray(instructions)
      ? instructions
      : instructions.split("\n").filter((item: string) => item.trim())

    addLog("info", "[RECIPES] Processing recipe data", {
      title,
      category,
      difficulty,
      ingredientsCount: ingredientsList.length,
      instructionsCount: instructionsList.length,
    })

    // Create recipe with automatic author assignment
    const recipeData = {
      title: title.trim(),
      description: description?.trim() || "",
      author_id: user.id,
      author_username: user.username, // Automatically filled from authenticated user
      category: category.trim(),
      difficulty: difficulty.trim(),
      prep_time_minutes: Number.parseInt(prepTime) || 0,
      cook_time_minutes: Number.parseInt(cookTime) || 0,
      servings: Number.parseInt(servings) || 1,
      ingredients: ingredientsList,
      instructions: instructionsList,
      image_url: imageUrl || null,
    }

    addLog("info", "[RECIPES] Creating recipe in database", {
      authorId: recipeData.author_id,
      authorUsername: recipeData.author_username,
      title: recipeData.title,
    })

    const recipe = await createRecipe(recipeData)

    addLog("info", "[RECIPES] Recipe created successfully", {
      recipeId: recipe.id,
      title: recipe.title,
      author: recipe.author_username,
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully",
      recipe: {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        status: recipe.moderation_status,
        created_at: recipe.created_at,
      },
    })
  } catch (error) {
    addLog("error", "[RECIPES] Error creating recipe", { error })
    console.error("❌ [RECIPES] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to create recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
