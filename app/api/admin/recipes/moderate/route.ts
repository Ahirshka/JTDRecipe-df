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

    // Check if user has admin/owner permissions
    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [MODERATE-API] User lacks admin permissions:", user.role)
      return NextResponse.json({ success: false, error: "Admin permissions required" }, { status: 403 })
    }

    console.log("✅ [MODERATE-API] User authenticated:", user.username, "Role:", user.role)

    // Parse request body
    const body = await request.json()
    const { recipeId, action, notes, updatedRecipe } = body

    console.log("📝 [MODERATE-API] Moderation request:", {
      recipeId,
      action,
      hasNotes: !!notes,
      hasUpdatedRecipe: !!updatedRecipe,
    })

    if (!recipeId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields: recipeId, action" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 },
      )
    }

    // Get the current recipe data
    console.log("🔍 [MODERATE-API] Fetching current recipe data...")
    const currentRecipeResult = await sql`
      SELECT * FROM recipes WHERE id = ${recipeId} LIMIT 1
    `

    if (currentRecipeResult.length === 0) {
      console.log("❌ [MODERATE-API] Recipe not found:", recipeId)
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const currentRecipe = currentRecipeResult[0]
    console.log("✅ [MODERATE-API] Current recipe found:", {
      id: currentRecipe.id,
      title: currentRecipe.title,
      status: currentRecipe.moderation_status,
      published: currentRecipe.is_published,
    })

    if (action === "approve") {
      console.log("✅ [MODERATE-API] Processing approval...")

      try {
        let recipeToApprove = currentRecipe

        // If updated recipe data is provided, use it
        if (updatedRecipe) {
          console.log("📝 [MODERATE-API] Using updated recipe data")

          // Safely process ingredients
          let processedIngredients = []
          try {
            if (Array.isArray(updatedRecipe.ingredients)) {
              processedIngredients = updatedRecipe.ingredients.filter((i) => i && i.trim())
            } else if (typeof updatedRecipe.ingredients === "string") {
              processedIngredients = JSON.parse(updatedRecipe.ingredients)
            } else if (updatedRecipe.ingredients) {
              processedIngredients = [String(updatedRecipe.ingredients)]
            }
          } catch (e) {
            console.log("⚠️ [MODERATE-API] Error processing ingredients, using current:", e)
            processedIngredients = Array.isArray(currentRecipe.ingredients)
              ? currentRecipe.ingredients
              : typeof currentRecipe.ingredients === "string"
                ? JSON.parse(currentRecipe.ingredients)
                : ["No ingredients specified"]
          }

          // Safely process instructions
          let processedInstructions = []
          try {
            if (Array.isArray(updatedRecipe.instructions)) {
              processedInstructions = updatedRecipe.instructions.filter((i) => i && i.trim())
            } else if (typeof updatedRecipe.instructions === "string") {
              processedInstructions = JSON.parse(updatedRecipe.instructions)
            } else if (updatedRecipe.instructions) {
              processedInstructions = [String(updatedRecipe.instructions)]
            }
          } catch (e) {
            console.log("⚠️ [MODERATE-API] Error processing instructions, using current:", e)
            processedInstructions = Array.isArray(currentRecipe.instructions)
              ? currentRecipe.instructions
              : typeof currentRecipe.instructions === "string"
                ? JSON.parse(currentRecipe.instructions)
                : ["No instructions specified"]
          }

          // Safely process tags
          let processedTags = []
          try {
            if (Array.isArray(updatedRecipe.tags)) {
              processedTags = updatedRecipe.tags.filter((t) => t && t.trim())
            } else if (typeof updatedRecipe.tags === "string") {
              processedTags = JSON.parse(updatedRecipe.tags)
            } else if (updatedRecipe.tags) {
              processedTags = [String(updatedRecipe.tags)]
            }
          } catch (e) {
            console.log("⚠️ [MODERATE-API] Error processing tags, using current:", e)
            processedTags = Array.isArray(currentRecipe.tags)
              ? currentRecipe.tags
              : typeof currentRecipe.tags === "string"
                ? JSON.parse(currentRecipe.tags)
                : []
          }

          // Add defaults if arrays are empty
          if (processedIngredients.length === 0) {
            processedIngredients = ["No ingredients specified"]
          }
          if (processedInstructions.length === 0) {
            processedInstructions = ["No instructions specified"]
          }

          console.log("📝 [MODERATE-API] Processed updated data:", {
            ingredientsCount: processedIngredients.length,
            instructionsCount: processedInstructions.length,
            tagsCount: processedTags.length,
          })

          // Update recipe with new data and approve it
          const updateResult = await sql`
            UPDATE recipes 
            SET 
              title = ${updatedRecipe.title || currentRecipe.title},
              description = ${updatedRecipe.description || currentRecipe.description || ""},
              category = ${updatedRecipe.category || currentRecipe.category},
              difficulty = ${updatedRecipe.difficulty || currentRecipe.difficulty},
              prep_time_minutes = ${Number(updatedRecipe.prep_time_minutes) || Number(currentRecipe.prep_time_minutes) || 0},
              cook_time_minutes = ${Number(updatedRecipe.cook_time_minutes) || Number(currentRecipe.cook_time_minutes) || 0},
              servings = ${Number(updatedRecipe.servings) || Number(currentRecipe.servings) || 1},
              image_url = ${updatedRecipe.image_url || currentRecipe.image_url || ""},
              ingredients = ${JSON.stringify(processedIngredients)}::jsonb,
              instructions = ${JSON.stringify(processedInstructions)}::jsonb,
              tags = ${JSON.stringify(processedTags)}::jsonb,
              moderation_status = 'approved',
              moderation_notes = ${notes || ""},
              is_published = true,
              updated_at = NOW()
            WHERE id = ${recipeId}
            RETURNING id, title, moderation_status, is_published, updated_at
          `

          if (updateResult.length === 0) {
            throw new Error("Failed to update recipe")
          }

          recipeToApprove = updateResult[0]
          console.log("✅ [MODERATE-API] Recipe updated and approved:", {
            id: recipeToApprove.id,
            title: recipeToApprove.title,
            status: recipeToApprove.moderation_status,
            published: recipeToApprove.is_published,
            updated_at: recipeToApprove.updated_at,
          })
        } else {
          // Just approve the existing recipe without changes
          console.log("✅ [MODERATE-API] Approving existing recipe without changes")

          const approveResult = await sql`
            UPDATE recipes 
            SET 
              moderation_status = 'approved',
              moderation_notes = ${notes || ""},
              is_published = true,
              updated_at = NOW()
            WHERE id = ${recipeId}
            RETURNING id, title, moderation_status, is_published, updated_at
          `

          if (approveResult.length === 0) {
            throw new Error("Failed to approve recipe")
          }

          recipeToApprove = approveResult[0]
          console.log("✅ [MODERATE-API] Recipe approved:", {
            id: recipeToApprove.id,
            title: recipeToApprove.title,
            status: recipeToApprove.moderation_status,
            published: recipeToApprove.is_published,
            updated_at: recipeToApprove.updated_at,
          })
        }

        // Verify the recipe was properly approved and published
        const verificationResult = await sql`
          SELECT id, title, moderation_status, is_published, updated_at 
          FROM recipes 
          WHERE id = ${recipeId} AND moderation_status = 'approved' AND is_published = true
          LIMIT 1
        `

        if (verificationResult.length === 0) {
          throw new Error("Recipe approval verification failed")
        }

        const verifiedRecipe = verificationResult[0]
        console.log("✅ [MODERATE-API] Recipe approval verified:", {
          id: verifiedRecipe.id,
          title: verifiedRecipe.title,
          status: verifiedRecipe.moderation_status,
          published: verifiedRecipe.is_published,
          approvalTime: verifiedRecipe.updated_at,
        })

        return NextResponse.json({
          success: true,
          message: `Recipe "${verifiedRecipe.title}" has been approved and published`,
          recipe: verifiedRecipe,
        })
      } catch (error) {
        console.error("❌ [MODERATE-API] Error during approval:", error)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to approve recipe: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 500 },
        )
      }
    } else if (action === "reject") {
      console.log("❌ [MODERATE-API] Processing rejection...")

      try {
        // First, safely process the recipe data for storage in rejected_recipes
        let processedIngredients = []
        let processedInstructions = []
        let processedTags = []

        try {
          processedIngredients = Array.isArray(currentRecipe.ingredients)
            ? currentRecipe.ingredients
            : typeof currentRecipe.ingredients === "string"
              ? JSON.parse(currentRecipe.ingredients)
              : ["No ingredients specified"]
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Error processing ingredients for rejection:", e)
          processedIngredients = ["No ingredients specified"]
        }

        try {
          processedInstructions = Array.isArray(currentRecipe.instructions)
            ? currentRecipe.instructions
            : typeof currentRecipe.instructions === "string"
              ? JSON.parse(currentRecipe.instructions)
              : ["No instructions specified"]
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Error processing instructions for rejection:", e)
          processedInstructions = ["No instructions specified"]
        }

        try {
          processedTags = Array.isArray(currentRecipe.tags)
            ? currentRecipe.tags
            : typeof currentRecipe.tags === "string"
              ? JSON.parse(currentRecipe.tags)
              : []
        } catch (e) {
          console.log("⚠️ [MODERATE-API] Error processing tags for rejection:", e)
          processedTags = []
        }

        console.log("📝 [MODERATE-API] Processed rejection data:", {
          ingredientsCount: processedIngredients.length,
          instructionsCount: processedInstructions.length,
          tagsCount: processedTags.length,
        })

        // Store in rejected_recipes table
        await sql`
          INSERT INTO rejected_recipes (
            original_recipe_id, title, description, author_id, author_username,
            category, difficulty, prep_time_minutes, cook_time_minutes, servings,
            image_url, ingredients, instructions, tags, rejection_reason,
            rejected_by, rejected_at, original_created_at
          ) VALUES (
            ${currentRecipe.id},
            ${currentRecipe.title || "Untitled Recipe"},
            ${currentRecipe.description || ""},
            ${currentRecipe.author_id},
            ${currentRecipe.author_username || "Unknown"},
            ${currentRecipe.category || "Other"},
            ${currentRecipe.difficulty || "Easy"},
            ${Number(currentRecipe.prep_time_minutes) || 0},
            ${Number(currentRecipe.cook_time_minutes) || 0},
            ${Number(currentRecipe.servings) || 1},
            ${currentRecipe.image_url || ""},
            ${JSON.stringify(processedIngredients)}::jsonb,
            ${JSON.stringify(processedInstructions)}::jsonb,
            ${JSON.stringify(processedTags)}::jsonb,
            ${notes || "No reason provided"},
            ${user.id},
            NOW(),
            ${currentRecipe.created_at}
          )
        `

        console.log("✅ [MODERATE-API] Recipe stored in rejected_recipes table")

        // Remove from main recipes table
        const deleteResult = await sql`
          DELETE FROM recipes WHERE id = ${recipeId}
          RETURNING id, title
        `

        if (deleteResult.length === 0) {
          throw new Error("Failed to delete rejected recipe")
        }

        const deletedRecipe = deleteResult[0]
        console.log("✅ [MODERATE-API] Recipe rejected and removed:", {
          id: deletedRecipe.id,
          title: deletedRecipe.title,
        })

        return NextResponse.json({
          success: true,
          message: `Recipe "${deletedRecipe.title}" has been rejected and moved to rejected recipes`,
          rejectedRecipe: deletedRecipe,
        })
      } catch (error) {
        console.error("❌ [MODERATE-API] Error during rejection:", error)
        return NextResponse.json(
          {
            success: false,
            error: `Failed to reject recipe: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("❌ [MODERATE-API] Unexpected error:", error)
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
