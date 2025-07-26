import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [MODERATE-API] Starting recipe moderation")

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

    console.log("✅ [MODERATE-API] User authenticated:", user.username, "Role:", user.role)

    // Parse request body
    const body = await request.json()
    const { recipeId, action, notes, recipeData } = body

    console.log("📝 [MODERATE-API] Moderation request:", {
      recipeId,
      action,
      hasNotes: !!notes,
      hasRecipeData: !!recipeData,
    })

    if (!recipeId || !action) {
      return NextResponse.json({ success: false, error: "Missing recipeId or action" }, { status: 400 })
    }

    if (action === "approve") {
      console.log("✅ [MODERATE-API] Processing approval for recipe:", recipeId)

      try {
        // If we have updated recipe data, use it; otherwise, get existing data
        let finalRecipeData = recipeData

        if (!finalRecipeData) {
          console.log("📋 [MODERATE-API] No recipe data provided, fetching existing recipe")
          const existingRecipe = await sql`
            SELECT * FROM recipes WHERE id = ${recipeId}
          `

          if (existingRecipe.length === 0) {
            console.log("❌ [MODERATE-API] Recipe not found:", recipeId)
            return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
          }

          finalRecipeData = existingRecipe[0]
          console.log("📋 [MODERATE-API] Using existing recipe data")
        }

        // Ensure all required fields have valid values
        const safeData = {
          title: finalRecipeData.title || "Untitled Recipe",
          description: finalRecipeData.description || "",
          category: finalRecipeData.category || "Other",
          difficulty: finalRecipeData.difficulty || "Easy",
          prep_time_minutes: Number(finalRecipeData.prep_time_minutes) || 0,
          cook_time_minutes: Number(finalRecipeData.cook_time_minutes) || 0,
          servings: Number(finalRecipeData.servings) || 1,
          image_url: finalRecipeData.image_url || "",
        }

        // Handle ingredients - ensure it's a valid JSON array
        let ingredients = []
        try {
          if (typeof finalRecipeData.ingredients === "string") {
            ingredients = JSON.parse(finalRecipeData.ingredients)
          } else if (Array.isArray(finalRecipeData.ingredients)) {
            ingredients = finalRecipeData.ingredients
          }
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Invalid ingredients data, using default")
          ingredients = ["No ingredients specified"]
        }

        if (!Array.isArray(ingredients) || ingredients.length === 0) {
          ingredients = ["No ingredients specified"]
        }

        // Handle instructions - ensure it's a valid JSON array
        let instructions = []
        try {
          if (typeof finalRecipeData.instructions === "string") {
            instructions = JSON.parse(finalRecipeData.instructions)
          } else if (Array.isArray(finalRecipeData.instructions)) {
            instructions = finalRecipeData.instructions
          }
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Invalid instructions data, using default")
          instructions = ["No instructions specified"]
        }

        if (!Array.isArray(instructions) || instructions.length === 0) {
          instructions = ["No instructions specified"]
        }

        // Handle tags
        let tags = []
        try {
          if (typeof finalRecipeData.tags === "string") {
            tags = JSON.parse(finalRecipeData.tags)
          } else if (Array.isArray(finalRecipeData.tags)) {
            tags = finalRecipeData.tags
          }
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Invalid tags data, using empty array")
          tags = []
        }

        if (!Array.isArray(tags)) {
          tags = []
        }

        console.log("📝 [MODERATE-API] Processed recipe data:", {
          title: safeData.title,
          category: safeData.category,
          difficulty: safeData.difficulty,
          ingredientsCount: ingredients.length,
          instructionsCount: instructions.length,
          tagsCount: tags.length,
        })

        // Update the recipe with approval status and ensure it's published
        const updateResult = await sql`
          UPDATE recipes 
          SET 
            title = ${safeData.title},
            description = ${safeData.description},
            category = ${safeData.category},
            difficulty = ${safeData.difficulty},
            prep_time_minutes = ${safeData.prep_time_minutes},
            cook_time_minutes = ${safeData.cook_time_minutes},
            servings = ${safeData.servings},
            image_url = ${safeData.image_url},
            ingredients = ${JSON.stringify(ingredients)}::jsonb,
            instructions = ${JSON.stringify(instructions)}::jsonb,
            tags = ${JSON.stringify(tags)}::jsonb,
            moderation_status = 'approved',
            is_published = true,
            moderation_notes = ${notes || null},
            updated_at = NOW()
          WHERE id = ${recipeId}
          RETURNING id, title, moderation_status, is_published, created_at, updated_at
        `

        if (updateResult.length === 0) {
          console.log("❌ [MODERATE-API] Failed to update recipe:", recipeId)
          return NextResponse.json({ success: false, error: "Failed to update recipe" }, { status: 500 })
        }

        const updatedRecipe = updateResult[0]
        console.log("✅ [MODERATE-API] Recipe approved successfully:", {
          id: updatedRecipe.id,
          title: updatedRecipe.title,
          status: updatedRecipe.moderation_status,
          published: updatedRecipe.is_published,
          updated_at: updatedRecipe.updated_at,
        })

        // Verify the recipe is now published
        const verifyResult = await sql`
          SELECT id, title, moderation_status, is_published, created_at, updated_at
          FROM recipes 
          WHERE id = ${recipeId} AND moderation_status = 'approved' AND is_published = true
        `

        if (verifyResult.length === 0) {
          console.log("❌ [MODERATE-API] Recipe approval verification failed")
          return NextResponse.json({ success: false, error: "Recipe approval verification failed" }, { status: 500 })
        }

        console.log("✅ [MODERATE-API] Recipe approval verified - recipe is now published")

        return NextResponse.json({
          success: true,
          message: `Recipe "${updatedRecipe.title}" has been approved and published`,
          recipe: updatedRecipe,
        })
      } catch (error) {
        console.error("❌ [MODERATE-API] Error approving recipe:", error)
        console.error("❌ [MODERATE-API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
        return NextResponse.json(
          {
            success: false,
            error: "Failed to approve recipe",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    } else if (action === "reject") {
      console.log("❌ [MODERATE-API] Processing rejection for recipe:", recipeId)

      try {
        // First, get the recipe data to store in rejected_recipes
        const recipeToReject = await sql`
          SELECT * FROM recipes WHERE id = ${recipeId}
        `

        if (recipeToReject.length === 0) {
          console.log("❌ [MODERATE-API] Recipe not found for rejection:", recipeId)
          return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
        }

        const recipe = recipeToReject[0]
        console.log("📋 [MODERATE-API] Recipe found for rejection:", recipe.title)

        // Ensure rejected_recipes table exists
        await sql`
          CREATE TABLE IF NOT EXISTS rejected_recipes (
            id VARCHAR(50) PRIMARY KEY,
            original_recipe_id VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            author_id INTEGER NOT NULL,
            author_username VARCHAR(50) NOT NULL,
            category VARCHAR(50) NOT NULL DEFAULT 'Other',
            difficulty VARCHAR(20) NOT NULL DEFAULT 'Easy',
            prep_time_minutes INTEGER NOT NULL DEFAULT 0,
            cook_time_minutes INTEGER NOT NULL DEFAULT 0,
            servings INTEGER NOT NULL DEFAULT 1,
            image_url TEXT DEFAULT '',
            ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
            instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
            tags JSONB DEFAULT '[]'::jsonb,
            rejection_reason TEXT,
            rejected_by INTEGER NOT NULL,
            rejected_at TIMESTAMP NOT NULL DEFAULT NOW(),
            original_created_at TIMESTAMP NOT NULL,
            UNIQUE(original_recipe_id)
          );
        `

        // Process the recipe data safely
        let ingredients = []
        let instructions = []
        let tags = []

        try {
          if (typeof recipe.ingredients === "string") {
            ingredients = JSON.parse(recipe.ingredients)
          } else if (Array.isArray(recipe.ingredients)) {
            ingredients = recipe.ingredients
          } else if (recipe.ingredients && typeof recipe.ingredients === "object") {
            ingredients = recipe.ingredients
          }
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Error parsing ingredients, using default")
          ingredients = ["No ingredients specified"]
        }

        try {
          if (typeof recipe.instructions === "string") {
            instructions = JSON.parse(recipe.instructions)
          } else if (Array.isArray(recipe.instructions)) {
            instructions = recipe.instructions
          } else if (recipe.instructions && typeof recipe.instructions === "object") {
            instructions = recipe.instructions
          }
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Error parsing instructions, using default")
          instructions = ["No instructions specified"]
        }

        try {
          if (typeof recipe.tags === "string") {
            tags = JSON.parse(recipe.tags)
          } else if (Array.isArray(recipe.tags)) {
            tags = recipe.tags
          } else if (recipe.tags && typeof recipe.tags === "object") {
            tags = recipe.tags
          }
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Error parsing tags, using empty array")
          tags = []
        }

        // Ensure arrays are valid
        if (!Array.isArray(ingredients)) ingredients = ["No ingredients specified"]
        if (!Array.isArray(instructions)) instructions = ["No instructions specified"]
        if (!Array.isArray(tags)) tags = []

        console.log("📝 [MODERATE-API] Processed rejection data:", {
          title: recipe.title,
          ingredientsCount: ingredients.length,
          instructionsCount: instructions.length,
          tagsCount: tags.length,
        })

        // Store in rejected_recipes table
        const rejectedId = `rejected_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

        await sql`
          INSERT INTO rejected_recipes (
            id, original_recipe_id, title, description, author_id, author_username,
            category, difficulty, prep_time_minutes, cook_time_minutes, servings,
            image_url, ingredients, instructions, tags, rejection_reason, rejected_by,
            rejected_at, original_created_at
          ) VALUES (
            ${rejectedId}, ${recipe.id}, ${recipe.title || "Untitled Recipe"}, 
            ${recipe.description || ""}, ${recipe.author_id}, ${recipe.author_username},
            ${recipe.category || "Other"}, ${recipe.difficulty || "Easy"}, 
            ${Number(recipe.prep_time_minutes) || 0}, ${Number(recipe.cook_time_minutes) || 0}, 
            ${Number(recipe.servings) || 1}, ${recipe.image_url || ""}, 
            ${JSON.stringify(ingredients)}::jsonb, ${JSON.stringify(instructions)}::jsonb, 
            ${JSON.stringify(tags)}::jsonb, ${notes || "No reason provided"}, ${user.id}, 
            NOW(), ${recipe.created_at}
          )
          ON CONFLICT (original_recipe_id) DO UPDATE SET
            rejection_reason = ${notes || "No reason provided"},
            rejected_by = ${user.id},
            rejected_at = NOW()
        `

        console.log("✅ [MODERATE-API] Recipe data stored in rejected_recipes table")

        // Remove from main recipes table
        const deleteResult = await sql`
          DELETE FROM recipes WHERE id = ${recipeId}
          RETURNING id, title
        `

        if (deleteResult.length === 0) {
          console.log("❌ [MODERATE-API] Failed to delete recipe from main table")
          return NextResponse.json({ success: false, error: "Failed to delete recipe" }, { status: 500 })
        }

        console.log("✅ [MODERATE-API] Recipe rejected and removed from main table:", deleteResult[0].title)

        return NextResponse.json({
          success: true,
          message: `Recipe "${deleteResult[0].title}" has been rejected`,
        })
      } catch (error) {
        console.error("❌ [MODERATE-API] Error rejecting recipe:", error)
        console.error("❌ [MODERATE-API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
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
      console.log("❌ [MODERATE-API] Invalid action:", action)
      return NextResponse.json({ success: false, error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 })
    }
  } catch (error) {
    console.error("❌ [MODERATE-API] General error:", error)
    console.error("❌ [MODERATE-API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
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
