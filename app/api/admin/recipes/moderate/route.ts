import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-MODERATE] Recipe moderation started")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [ADMIN-MODERATE] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin/owner
    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [ADMIN-MODERATE] User lacks admin permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-MODERATE] Admin permissions verified for user:", user.username)

    // Parse request body
    const body = await request.json()
    const { recipeId, action, notes, edits } = body

    console.log("📝 [ADMIN-MODERATE] Moderation request:", {
      recipeId,
      action,
      hasNotes: !!notes,
      hasEdits: !!edits,
    })

    if (!recipeId || !action) {
      return NextResponse.json({ success: false, error: "Recipe ID and action are required" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Action must be 'approve' or 'reject'" }, { status: 400 })
    }

    // Check if recipe exists and get current data
    const existingRecipe = await sql`
      SELECT * FROM recipes WHERE id = ${recipeId}
    `

    if (existingRecipe.length === 0) {
      console.log("❌ [ADMIN-MODERATE] Recipe not found:", recipeId)
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = existingRecipe[0]
    console.log("✅ [ADMIN-MODERATE] Recipe found:", {
      id: recipe.id,
      title: recipe.title,
      currentStatus: recipe.moderation_status,
    })

    if (action === "reject") {
      console.log("🔄 [ADMIN-MODERATE] Processing rejection - moving to rejected_recipes table")

      try {
        // Ensure rejected_recipes table exists
        await sql`
          CREATE TABLE IF NOT EXISTS rejected_recipes (
            id SERIAL PRIMARY KEY,
            original_recipe_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            author_id INTEGER NOT NULL,
            author_username VARCHAR(100) NOT NULL,
            category VARCHAR(100) NOT NULL,
            difficulty VARCHAR(50) NOT NULL,
            prep_time_minutes INTEGER DEFAULT 0,
            cook_time_minutes INTEGER DEFAULT 0,
            servings INTEGER DEFAULT 1,
            image_url TEXT,
            ingredients JSONB NOT NULL,
            instructions JSONB NOT NULL,
            tags JSONB DEFAULT '[]'::jsonb,
            rejection_reason TEXT,
            rejected_by INTEGER NOT NULL,
            rejected_at TIMESTAMP DEFAULT NOW(),
            original_created_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `

        // Insert into rejected_recipes table
        await sql`
          INSERT INTO rejected_recipes (
            original_recipe_id, title, description, author_id, author_username,
            category, difficulty, prep_time_minutes, cook_time_minutes, servings,
            image_url, ingredients, instructions, tags, rejection_reason,
            rejected_by, rejected_at, original_created_at
          )
          VALUES (
            ${recipe.id}, 
            ${recipe.title}, 
            ${recipe.description || ""}, 
            ${recipe.author_id}, 
            ${recipe.author_username}, 
            ${recipe.category}, 
            ${recipe.difficulty},
            ${recipe.prep_time_minutes || 0}, 
            ${recipe.cook_time_minutes || 0}, 
            ${recipe.servings || 1},
            ${recipe.image_url || ""}, 
            ${recipe.ingredients}::jsonb, 
            ${recipe.instructions}::jsonb, 
            ${recipe.tags || "[]"}::jsonb, 
            ${notes || "No reason provided"}, 
            ${user.id}, 
            NOW(), 
            ${recipe.created_at}
          )
        `

        console.log("✅ [ADMIN-MODERATE] Recipe inserted into rejected_recipes table")

        // Delete from recipes table
        await sql`
          DELETE FROM recipes WHERE id = ${recipeId}
        `

        console.log("✅ [ADMIN-MODERATE] Recipe deleted from recipes table")

        return NextResponse.json({
          success: true,
          message: `Recipe "${recipe.title}" has been rejected and archived`,
        })
      } catch (rejectionError) {
        console.error("❌ [ADMIN-MODERATE] Error during rejection process:", rejectionError)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to reject recipe",
            details: rejectionError instanceof Error ? rejectionError.message : "Unknown error",
          },
          { status: 500 },
        )
      }
    }

    // Handle approval
    console.log("🔄 [ADMIN-MODERATE] Processing approval")

    try {
      // Prepare moderation data
      const moderationStatus = "approved"
      const isPublished = true
      const moderationNotes = notes || null

      // Start with base update data
      let updateTitle = recipe.title
      let updateDescription = recipe.description || ""
      let updateCategory = recipe.category
      let updateDifficulty = recipe.difficulty
      let updateIngredients = recipe.ingredients
      let updateInstructions = recipe.instructions

      // If approving with edits, apply the edits
      if (edits) {
        console.log("📝 [ADMIN-MODERATE] Applying edits to recipe")

        if (edits.title && edits.title.trim()) updateTitle = edits.title.trim()
        if (edits.description !== undefined) updateDescription = edits.description.trim()
        if (edits.category && edits.category.trim()) updateCategory = edits.category.trim()
        if (edits.difficulty && edits.difficulty.trim()) updateDifficulty = edits.difficulty.trim()

        // Handle ingredients and instructions
        if (edits.ingredients) {
          const ingredientsArray =
            typeof edits.ingredients === "string"
              ? edits.ingredients.split("\n").filter((i) => i.trim())
              : Array.isArray(edits.ingredients)
                ? edits.ingredients
                : []
          updateIngredients = JSON.stringify(ingredientsArray)
        }

        if (edits.instructions) {
          const instructionsArray =
            typeof edits.instructions === "string"
              ? edits.instructions.split("\n").filter((i) => i.trim())
              : Array.isArray(edits.instructions)
                ? edits.instructions
                : []
          updateInstructions = JSON.stringify(instructionsArray)
        }

        console.log("📝 [ADMIN-MODERATE] Edit data prepared:", {
          title: updateTitle,
          category: updateCategory,
          difficulty: updateDifficulty,
          ingredientsLength: JSON.parse(updateIngredients).length,
          instructionsLength: JSON.parse(updateInstructions).length,
        })
      }

      // Update recipe with proper JSONB casting
      const result = await sql`
        UPDATE recipes 
        SET 
          moderation_status = ${moderationStatus},
          moderation_notes = ${moderationNotes},
          is_published = ${isPublished},
          title = ${updateTitle},
          description = ${updateDescription},
          category = ${updateCategory},
          difficulty = ${updateDifficulty},
          ingredients = ${updateIngredients}::jsonb,
          instructions = ${updateInstructions}::jsonb,
          updated_at = NOW()
        WHERE id = ${recipeId}
        RETURNING id, title, moderation_status, is_published, updated_at
      `

      if (result.length === 0) {
        console.log("❌ [ADMIN-MODERATE] Failed to update recipe")
        return NextResponse.json({ success: false, error: "Failed to update recipe" }, { status: 500 })
      }

      const updatedRecipe = result[0]
      console.log("✅ [ADMIN-MODERATE] Recipe approved successfully:", {
        id: updatedRecipe.id,
        title: updatedRecipe.title,
        status: updatedRecipe.moderation_status,
        published: updatedRecipe.is_published,
        updated: updatedRecipe.updated_at,
      })

      // Verify the update worked
      const verifyResult = await sql`
        SELECT id, title, moderation_status, is_published FROM recipes WHERE id = ${recipeId}
      `

      console.log("🔍 [ADMIN-MODERATE] Final verification:", verifyResult[0])

      return NextResponse.json({
        success: true,
        message: `Recipe "${updatedRecipe.title}" has been approved and published successfully`,
        recipe: updatedRecipe,
      })
    } catch (approvalError) {
      console.error("❌ [ADMIN-MODERATE] Error during approval process:", approvalError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to approve recipe",
          details: approvalError instanceof Error ? approvalError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [ADMIN-MODERATE] Recipe moderation error:", error)
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
