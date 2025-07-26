import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [MODERATE-API] Processing moderation request")

    // Get user from session
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [MODERATE-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Check if user has admin privileges
    if (user.role !== "owner" && user.role !== "admin") {
      console.log("❌ [MODERATE-API] User lacks admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin privileges required" }, { status: 403 })
    }

    console.log("✅ [MODERATE-API] Admin user authenticated:", user.username)

    // Parse request body
    const body = await request.json()
    const { recipeId, action, comment, updatedRecipe } = body

    console.log("📝 [MODERATE-API] Moderation request:", {
      recipeId,
      action,
      hasComment: !!comment,
      hasUpdatedRecipe: !!updatedRecipe,
    })

    if (!recipeId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields: recipeId, action" }, { status: 400 })
    }

    if (action === "approve") {
      console.log("✅ [MODERATE-API] Processing approval for recipe:", recipeId)

      let recipeData = updatedRecipe
      if (!recipeData) {
        // Get existing recipe data if no updated data provided
        const existingRecipe = await sql`
          SELECT * FROM recipes WHERE id = ${recipeId} AND moderation_status = 'pending'
        `

        if (existingRecipe.length === 0) {
          console.log("❌ [MODERATE-API] Recipe not found or not pending:", recipeId)
          return NextResponse.json({ success: false, error: "Recipe not found or not pending" }, { status: 404 })
        }

        recipeData = existingRecipe[0]
      }

      // Ensure data is properly formatted
      const safeIngredients = Array.isArray(recipeData.ingredients)
        ? recipeData.ingredients
        : typeof recipeData.ingredients === "string"
          ? JSON.parse(recipeData.ingredients)
          : ["No ingredients specified"]

      const safeInstructions = Array.isArray(recipeData.instructions)
        ? recipeData.instructions
        : typeof recipeData.instructions === "string"
          ? JSON.parse(recipeData.instructions)
          : ["No instructions specified"]

      const safeTags = Array.isArray(recipeData.tags)
        ? recipeData.tags
        : typeof recipeData.tags === "string"
          ? JSON.parse(recipeData.tags)
          : []

      console.log("📝 [MODERATE-API] Processing recipe data:", {
        title: recipeData.title,
        ingredientsCount: safeIngredients.length,
        instructionsCount: safeInstructions.length,
        tagsCount: safeTags.length,
      })

      // Update recipe to approved and published status
      const result = await sql`
        UPDATE recipes 
        SET 
          title = ${recipeData.title || "Untitled Recipe"},
          description = ${recipeData.description || ""},
          category = ${recipeData.category || "Other"},
          difficulty = ${recipeData.difficulty || "Medium"},
          prep_time_minutes = ${Number(recipeData.prep_time_minutes) || 0},
          cook_time_minutes = ${Number(recipeData.cook_time_minutes) || 0},
          servings = ${Number(recipeData.servings) || 1},
          image_url = ${recipeData.image_url || ""},
          ingredients = ${JSON.stringify(safeIngredients)}::jsonb,
          instructions = ${JSON.stringify(safeInstructions)}::jsonb,
          tags = ${JSON.stringify(safeTags)}::jsonb,
          moderation_status = 'approved',
          is_published = true,
          updated_at = NOW()
        WHERE id = ${recipeId}
        RETURNING id, title, moderation_status, is_published, updated_at
      `

      if (result.length === 0) {
        console.log("❌ [MODERATE-API] Failed to approve recipe:", recipeId)
        return NextResponse.json({ success: false, error: "Failed to approve recipe" }, { status: 500 })
      }

      const approvedRecipe = result[0]
      console.log("✅ [MODERATE-API] Recipe approved successfully:", {
        id: approvedRecipe.id,
        title: approvedRecipe.title,
        status: approvedRecipe.moderation_status,
        published: approvedRecipe.is_published,
        updated: approvedRecipe.updated_at,
      })

      return NextResponse.json({
        success: true,
        message: "Recipe approved and published successfully",
        recipe: approvedRecipe,
      })
    } else if (action === "reject") {
      console.log("❌ [MODERATE-API] Processing rejection for recipe:", recipeId)

      // Get the recipe data before rejection
      const recipeToReject = await sql`
        SELECT * FROM recipes WHERE id = ${recipeId} AND moderation_status = 'pending'
      `

      if (recipeToReject.length === 0) {
        console.log("❌ [MODERATE-API] Recipe not found or not pending:", recipeId)
        return NextResponse.json({ success: false, error: "Recipe not found or not pending" }, { status: 404 })
      }

      const recipe = recipeToReject[0]

      try {
        // Ensure rejected_recipes table exists
        await sql`
          CREATE TABLE IF NOT EXISTS rejected_recipes (
            id TEXT PRIMARY KEY,
            original_recipe_id TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            description TEXT DEFAULT '',
            author_id TEXT NOT NULL,
            author_username TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'Other',
            difficulty TEXT NOT NULL DEFAULT 'Medium',
            prep_time_minutes INTEGER DEFAULT 0,
            cook_time_minutes INTEGER DEFAULT 0,
            servings INTEGER DEFAULT 1,
            image_url TEXT DEFAULT '',
            ingredients JSONB DEFAULT '[]'::jsonb,
            instructions JSONB DEFAULT '[]'::jsonb,
            tags JSONB DEFAULT '[]'::jsonb,
            rejection_reason TEXT DEFAULT '',
            rejected_by TEXT NOT NULL,
            rejected_at TIMESTAMP DEFAULT NOW(),
            original_created_at TIMESTAMP,
            original_updated_at TIMESTAMP
          )
        `

        // Process ingredients and instructions safely
        const safeIngredients = Array.isArray(recipe.ingredients)
          ? recipe.ingredients
          : typeof recipe.ingredients === "string"
            ? JSON.parse(recipe.ingredients || "[]")
            : []

        const safeInstructions = Array.isArray(recipe.instructions)
          ? recipe.instructions
          : typeof recipe.instructions === "string"
            ? JSON.parse(recipe.instructions || "[]")
            : []

        const safeTags = Array.isArray(recipe.tags)
          ? recipe.tags
          : typeof recipe.tags === "string"
            ? JSON.parse(recipe.tags || "[]")
            : []

        console.log("📝 [MODERATE-API] Storing rejected recipe data:", {
          originalId: recipe.id,
          title: recipe.title,
          ingredientsCount: safeIngredients.length,
          instructionsCount: safeInstructions.length,
        })

        // Store rejected recipe
        await sql`
          INSERT INTO rejected_recipes (
            id, original_recipe_id, title, description, author_id, author_username,
            category, difficulty, prep_time_minutes, cook_time_minutes, servings,
            image_url, ingredients, instructions, tags, rejection_reason, rejected_by,
            rejected_at, original_created_at, original_updated_at
          )
          VALUES (
            ${`rejected_${recipe.id}_${Date.now()}`}, ${recipe.id}, ${recipe.title || ""},
            ${recipe.description || ""}, ${recipe.author_id}, ${recipe.author_username || ""},
            ${recipe.category || "Other"}, ${recipe.difficulty || "Medium"},
            ${Number(recipe.prep_time_minutes) || 0}, ${Number(recipe.cook_time_minutes) || 0},
            ${Number(recipe.servings) || 1}, ${recipe.image_url || ""},
            ${JSON.stringify(safeIngredients)}::jsonb, ${JSON.stringify(safeInstructions)}::jsonb,
            ${JSON.stringify(safeTags)}::jsonb, ${comment || "No reason provided"},
            ${user.username}, NOW(), ${recipe.created_at}, ${recipe.updated_at}
          )
        `

        // Remove from main recipes table
        await sql`DELETE FROM recipes WHERE id = ${recipeId}`

        console.log("✅ [MODERATE-API] Recipe rejected and moved to rejected_recipes table")

        return NextResponse.json({
          success: true,
          message: "Recipe rejected successfully",
        })
      } catch (error) {
        console.error("❌ [MODERATE-API] Error processing rejection:", error)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to reject recipe",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ [MODERATE-API] Error processing moderation:", error)
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
