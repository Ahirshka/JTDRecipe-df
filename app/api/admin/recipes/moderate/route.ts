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

    console.log("✅ [MODERATE-API] User authenticated with admin permissions:", user.username)

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
      return NextResponse.json({ success: false, error: "Missing recipeId or action" }, { status: 400 })
    }

    if (action === "approve") {
      console.log("✅ [MODERATE-API] Processing recipe approval")

      try {
        // If we have updated recipe data, use it; otherwise get existing recipe
        let recipeData = updatedRecipe
        if (!recipeData) {
          console.log("🔍 [MODERATE-API] Fetching existing recipe data")
          const existingRecipe = await sql`
            SELECT * FROM recipes WHERE id = ${recipeId} LIMIT 1
          `

          if (existingRecipe.length === 0) {
            console.log("❌ [MODERATE-API] Recipe not found:", recipeId)
            return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
          }

          recipeData = existingRecipe[0]
          console.log("✅ [MODERATE-API] Found existing recipe:", recipeData.title)
        }

        // Ensure we have valid data for all required fields
        const safeRecipeData = {
          title: recipeData.title || "Untitled Recipe",
          description: recipeData.description || "",
          category: recipeData.category || "Other",
          difficulty: recipeData.difficulty || "Easy",
          prep_time_minutes: Number(recipeData.prep_time_minutes) || 0,
          cook_time_minutes: Number(recipeData.cook_time_minutes) || 0,
          servings: Number(recipeData.servings) || 1,
          image_url: recipeData.image_url || "",
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          tags: recipeData.tags || [],
        }

        // Process ingredients - handle both string and array formats
        let processedIngredients = []
        if (typeof safeRecipeData.ingredients === "string") {
          try {
            processedIngredients = JSON.parse(safeRecipeData.ingredients)
          } catch {
            processedIngredients = [safeRecipeData.ingredients]
          }
        } else if (Array.isArray(safeRecipeData.ingredients)) {
          processedIngredients = safeRecipeData.ingredients
        }

        // Process instructions - handle both string and array formats
        let processedInstructions = []
        if (typeof safeRecipeData.instructions === "string") {
          try {
            processedInstructions = JSON.parse(safeRecipeData.instructions)
          } catch {
            processedInstructions = [safeRecipeData.instructions]
          }
        } else if (Array.isArray(safeRecipeData.instructions)) {
          processedInstructions = safeRecipeData.instructions
        }

        // Process tags
        let processedTags = []
        if (typeof safeRecipeData.tags === "string") {
          try {
            processedTags = JSON.parse(safeRecipeData.tags)
          } catch {
            processedTags = safeRecipeData.tags.split(",").map((tag) => tag.trim())
          }
        } else if (Array.isArray(safeRecipeData.tags)) {
          processedTags = safeRecipeData.tags
        }

        // Ensure arrays have at least one item for testing
        if (processedIngredients.length === 0) {
          processedIngredients = ["No ingredients specified"]
        }
        if (processedInstructions.length === 0) {
          processedInstructions = ["No instructions specified"]
        }

        console.log("📝 [MODERATE-API] Processed recipe data:", {
          title: safeRecipeData.title,
          ingredientsCount: processedIngredients.length,
          instructionsCount: processedInstructions.length,
          tagsCount: processedTags.length,
        })

        // Update recipe with approval - CRITICAL: Set approved_at timestamp
        const approvalResult = await sql`
          UPDATE recipes 
          SET 
            title = ${safeRecipeData.title},
            description = ${safeRecipeData.description},
            category = ${safeRecipeData.category},
            difficulty = ${safeRecipeData.difficulty},
            prep_time_minutes = ${safeRecipeData.prep_time_minutes},
            cook_time_minutes = ${safeRecipeData.cook_time_minutes},
            servings = ${safeRecipeData.servings},
            image_url = ${safeRecipeData.image_url},
            ingredients = ${JSON.stringify(processedIngredients)}::jsonb,
            instructions = ${JSON.stringify(processedInstructions)}::jsonb,
            tags = ${JSON.stringify(processedTags)}::jsonb,
            moderation_status = 'approved',
            moderation_notes = ${notes || null},
            is_published = true,
            updated_at = NOW()
          WHERE id = ${recipeId}
          RETURNING id, title, moderation_status, is_published, updated_at
        `

        if (approvalResult.length === 0) {
          console.log("❌ [MODERATE-API] Failed to update recipe")
          return NextResponse.json({ success: false, error: "Failed to approve recipe" }, { status: 500 })
        }

        const approvedRecipe = approvalResult[0]
        console.log("✅ [MODERATE-API] Recipe approved successfully:", {
          id: approvedRecipe.id,
          title: approvedRecipe.title,
          status: approvedRecipe.moderation_status,
          published: approvedRecipe.is_published,
          approved_at: approvedRecipe.updated_at,
        })

        // Verify the recipe is now published and approved
        const verificationResult = await sql`
          SELECT id, title, moderation_status, is_published, updated_at, created_at
          FROM recipes 
          WHERE id = ${recipeId} AND moderation_status = 'approved' AND is_published = true
          LIMIT 1
        `

        if (verificationResult.length === 0) {
          console.log("❌ [MODERATE-API] Recipe approval verification failed")
          return NextResponse.json({ success: false, error: "Recipe approval verification failed" }, { status: 500 })
        }

        const verifiedRecipe = verificationResult[0]
        console.log("✅ [MODERATE-API] Recipe approval verified:", {
          id: verifiedRecipe.id,
          title: verifiedRecipe.title,
          status: verifiedRecipe.moderation_status,
          published: verifiedRecipe.is_published,
          created_at: verifiedRecipe.created_at,
          approved_at: verifiedRecipe.updated_at,
        })

        return NextResponse.json({
          success: true,
          message: `Recipe "${approvedRecipe.title}" has been approved and published`,
          recipe: verifiedRecipe,
        })
      } catch (error) {
        console.error("❌ [MODERATE-API] Error during approval:", error)
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
      console.log("❌ [MODERATE-API] Processing recipe rejection")

      try {
        // Get the recipe data before rejecting
        const recipeToReject = await sql`
          SELECT * FROM recipes WHERE id = ${recipeId} LIMIT 1
        `

        if (recipeToReject.length === 0) {
          console.log("❌ [MODERATE-API] Recipe not found for rejection:", recipeId)
          return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
        }

        const recipe = recipeToReject[0]
        console.log("📝 [MODERATE-API] Recipe to reject:", {
          id: recipe.id,
          title: recipe.title,
          author: recipe.author_username,
        })

        // Process ingredients and instructions safely
        let processedIngredients = []
        let processedInstructions = []
        let processedTags = []

        try {
          if (recipe.ingredients) {
            if (typeof recipe.ingredients === "string") {
              processedIngredients = JSON.parse(recipe.ingredients)
            } else if (Array.isArray(recipe.ingredients)) {
              processedIngredients = recipe.ingredients
            } else {
              processedIngredients = [String(recipe.ingredients)]
            }
          }
        } catch (error) {
          console.log("⚠️ [MODERATE-API] Error processing ingredients, using default")
          processedIngredients = ["Ingredients not available"]
        }

        try {
          if (recipe.instructions) {
            if (typeof recipe.instructions === "string") {
              processedInstructions = JSON.parse(recipe.instructions)
            } else if (Array.isArray(recipe.instructions)) {
              processedInstructions = recipe.instructions
            } else {
              processedInstructions = [String(recipe.instructions)]
            }
          }
        } catch (error) {
          console.log("⚠️ [MODERATE-API] Error processing instructions, using default")
          processedInstructions = ["Instructions not available"]
        }

        try {
          if (recipe.tags) {
            if (typeof recipe.tags === "string") {
              processedTags = JSON.parse(recipe.tags)
            } else if (Array.isArray(recipe.tags)) {
              processedTags = recipe.tags
            } else {
              processedTags = [String(recipe.tags)]
            }
          }
        } catch (error) {
          console.log("⚠️ [MODERATE-API] Error processing tags, using empty array")
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
            rejected_by, rejected_at
          ) VALUES (
            ${recipe.id}, ${recipe.title || "Untitled"}, ${recipe.description || ""}, 
            ${recipe.author_id}, ${recipe.author_username || "Unknown"},
            ${recipe.category || "Other"}, ${recipe.difficulty || "Easy"},
            ${Number(recipe.prep_time_minutes) || 0}, ${Number(recipe.cook_time_minutes) || 0},
            ${Number(recipe.servings) || 1}, ${recipe.image_url || ""},
            ${JSON.stringify(processedIngredients)}::jsonb,
            ${JSON.stringify(processedInstructions)}::jsonb,
            ${JSON.stringify(processedTags)}::jsonb,
            ${notes || "No reason provided"}, ${user.id}, NOW()
          )
        `

        // Update original recipe status
        const rejectionResult = await sql`
          UPDATE recipes 
          SET 
            moderation_status = 'rejected',
            moderation_notes = ${notes || "No reason provided"},
            is_published = false,
            updated_at = NOW()
          WHERE id = ${recipeId}
          RETURNING id, title, moderation_status
        `

        if (rejectionResult.length === 0) {
          console.log("❌ [MODERATE-API] Failed to reject recipe")
          return NextResponse.json({ success: false, error: "Failed to reject recipe" }, { status: 500 })
        }

        const rejectedRecipe = rejectionResult[0]
        console.log("✅ [MODERATE-API] Recipe rejected successfully:", {
          id: rejectedRecipe.id,
          title: rejectedRecipe.title,
          status: rejectedRecipe.moderation_status,
        })

        return NextResponse.json({
          success: true,
          message: `Recipe "${rejectedRecipe.title}" has been rejected`,
          recipe: rejectedRecipe,
        })
      } catch (error) {
        console.error("❌ [MODERATE-API] Error during rejection:", error)
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
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("❌ [MODERATE-API] Unexpected error:", error)
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
