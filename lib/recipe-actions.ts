"use server"

import { createRecipe, findSessionByToken, findUserById } from "@/lib/neon"
import { cookies } from "next/headers"

export interface RecipeFormData {
  title: string
  description?: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  ingredients: string[]
  instructions: string[]
  tags: string[]
}

export async function submitRecipe(formData: RecipeFormData) {
  console.log("🔄 [SERVER-ACTION] Recipe submission started")

  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    console.log("🔍 [SERVER-ACTION] Session token:", sessionToken ? `${sessionToken.substring(0, 10)}...` : "Not found")

    if (!sessionToken) {
      console.log("❌ [SERVER-ACTION] No session token provided")
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Verify session
    const session = await findSessionByToken(sessionToken)
    if (!session) {
      console.log("❌ [SERVER-ACTION] Invalid or expired session")
      return {
        success: false,
        error: "Invalid or expired session",
      }
    }

    // Get user details
    const user = await findUserById(session.user_id)
    if (!user) {
      console.log("❌ [SERVER-ACTION] User not found for session")
      return {
        success: false,
        error: "User not found",
      }
    }

    console.log("✅ [SERVER-ACTION] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

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

    const missingFields = requiredFields.filter((field) => !formData[field as keyof RecipeFormData])
    if (missingFields.length > 0) {
      console.log("❌ [SERVER-ACTION] Missing required fields:", missingFields)
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      }
    }

    // Validate arrays
    if (!Array.isArray(formData.ingredients) || formData.ingredients.length === 0) {
      console.log("❌ [SERVER-ACTION] Invalid ingredients array")
      return {
        success: false,
        error: "Ingredients must be a non-empty array",
      }
    }

    if (!Array.isArray(formData.instructions) || formData.instructions.length === 0) {
      console.log("❌ [SERVER-ACTION] Invalid instructions array")
      return {
        success: false,
        error: "Instructions must be a non-empty array",
      }
    }

    // Process arrays to remove empty items
    const processedIngredients = formData.ingredients
      .filter((item: string) => item && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedInstructions = formData.instructions
      .filter((item: string) => item && item.trim().length > 0)
      .map((item: string) => item.trim())

    const processedTags = Array.isArray(formData.tags)
      ? formData.tags.filter((item: string) => item && item.trim().length > 0).map((item: string) => item.trim())
      : []

    console.log("🔄 [SERVER-ACTION] Processed arrays:", {
      ingredients: processedIngredients.length,
      instructions: processedInstructions.length,
      tags: processedTags.length,
    })

    // Prepare recipe data
    const recipeData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      author_id: user.id,
      author_username: user.username,
      category: formData.category.trim(),
      difficulty: formData.difficulty.trim(),
      prep_time_minutes: Number(formData.prep_time_minutes),
      cook_time_minutes: Number(formData.cook_time_minutes),
      servings: Number(formData.servings),
      image_url: formData.image_url?.trim() || null,
      ingredients: processedIngredients,
      instructions: processedInstructions,
      tags: processedTags,
    }

    console.log("📝 [SERVER-ACTION] Final recipe data prepared:", {
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
      console.log("❌ [SERVER-ACTION] Failed to create recipe in database")
      return {
        success: false,
        error: result?.error || "Failed to create recipe in database",
      }
    }

    console.log("✅ [SERVER-ACTION] Recipe created successfully:", result.recipeId)

    return {
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipeId: result.recipeId,
      data: {
        title: recipeData.title,
        author: recipeData.author_username,
        status: "pending_moderation",
      },
    }
  } catch (error) {
    console.error("❌ [SERVER-ACTION] Recipe submission error:", error)
    return {
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function getRecipesByUser(userId: number) {
  console.log("🔄 [SERVER-ACTION] Getting recipes for user:", userId)

  try {
    const { sql } = await import("@/lib/neon")

    const recipes = await sql`
      SELECT * FROM recipes 
      WHERE author_id = ${userId}
      ORDER BY created_at DESC
    `

    console.log(`✅ [SERVER-ACTION] Retrieved ${recipes.length} recipes for user ${userId}`)

    return {
      success: true,
      data: recipes,
    }
  } catch (error) {
    console.error("❌ [SERVER-ACTION] Get user recipes error:", error)
    return {
      success: false,
      error: `Failed to get user recipes: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function deleteRecipe(recipeId: string) {
  console.log("🔄 [SERVER-ACTION] Deleting recipe:", recipeId)

  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session_token")?.value

    if (!sessionToken) {
      console.log("❌ [SERVER-ACTION] No session token provided")
      return {
        success: false,
        error: "Authentication required",
      }
    }

    // Verify session
    const session = await findSessionByToken(sessionToken)
    if (!session) {
      console.log("❌ [SERVER-ACTION] Invalid or expired session")
      return {
        success: false,
        error: "Invalid or expired session",
      }
    }

    // Get user details
    const user = await findUserById(session.user_id)
    if (!user) {
      console.log("❌ [SERVER-ACTION] User not found for session")
      return {
        success: false,
        error: "User not found",
      }
    }

    const { sql } = await import("@/lib/neon")

    // Check if user owns the recipe or is admin
    const recipe = await sql`
      SELECT * FROM recipes 
      WHERE id = ${recipeId}
      LIMIT 1
    `

    if (recipe.length === 0) {
      console.log("❌ [SERVER-ACTION] Recipe not found")
      return {
        success: false,
        error: "Recipe not found",
      }
    }

    if (recipe[0].author_id !== user.id && user.role !== "admin") {
      console.log("❌ [SERVER-ACTION] User not authorized to delete recipe")
      return {
        success: false,
        error: "Not authorized to delete this recipe",
      }
    }

    // Delete recipe
    await sql`
      DELETE FROM recipes 
      WHERE id = ${recipeId}
    `

    console.log("✅ [SERVER-ACTION] Recipe deleted successfully:", recipeId)

    return {
      success: true,
      message: "Recipe deleted successfully",
    }
  } catch (error) {
    console.error("❌ [SERVER-ACTION] Delete recipe error:", error)
    return {
      success: false,
      error: `Failed to delete recipe: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
