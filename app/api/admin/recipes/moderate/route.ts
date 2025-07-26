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

    // Prepare moderation data
    const moderationStatus = action === "approve" ? "approved" : "rejected"
    const isPublished = action === "approve"
    const moderationNotes = notes || null

    console.log("🔄 [ADMIN-MODERATE] Updating recipe with:", {
      status: moderationStatus,
      published: isPublished,
      notes: moderationNotes,
    })

    // Start with base update data
    const updateData: any = {
      moderation_status: moderationStatus,
      moderation_notes: moderationNotes,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    }

    // If approving with edits, include the edits
    if (action === "approve" && edits) {
      console.log("📝 [ADMIN-MODERATE] Applying edits to recipe")

      if (edits.title) updateData.title = edits.title
      if (edits.description) updateData.description = edits.description
      if (edits.category) updateData.category = edits.category
      if (edits.difficulty) updateData.difficulty = edits.difficulty

      // Handle ingredients and instructions
      if (edits.ingredients) {
        const ingredientsArray =
          typeof edits.ingredients === "string"
            ? edits.ingredients.split("\n").filter((i) => i.trim())
            : edits.ingredients
        updateData.ingredients = JSON.stringify(ingredientsArray)
      }

      if (edits.instructions) {
        const instructionsArray =
          typeof edits.instructions === "string"
            ? edits.instructions.split("\n").filter((i) => i.trim())
            : edits.instructions
        updateData.instructions = JSON.stringify(instructionsArray)
      }

      console.log("📝 [ADMIN-MODERATE] Edit data prepared:", {
        title: updateData.title,
        category: updateData.category,
        difficulty: updateData.difficulty,
        hasIngredients: !!updateData.ingredients,
        hasInstructions: !!updateData.instructions,
      })
    }

    // Update recipe using dynamic SQL
    const result = await sql`
      UPDATE recipes 
      SET 
        moderation_status = ${updateData.moderation_status},
        moderation_notes = ${updateData.moderation_notes},
        is_published = ${updateData.is_published},
        title = ${updateData.title || recipe.title},
        description = ${updateData.description || recipe.description},
        category = ${updateData.category || recipe.category},
        difficulty = ${updateData.difficulty || recipe.difficulty},
        ingredients = ${updateData.ingredients ? updateData.ingredients + "::jsonb" : recipe.ingredients},
        instructions = ${updateData.instructions ? updateData.instructions + "::jsonb" : recipe.instructions},
        updated_at = ${updateData.updated_at}
      WHERE id = ${recipeId}
      RETURNING id, title, moderation_status, is_published, updated_at
    `

    if (result.length === 0) {
      console.log("❌ [ADMIN-MODERATE] Failed to update recipe")
      return NextResponse.json({ success: false, error: "Failed to update recipe" }, { status: 500 })
    }

    const updatedRecipe = result[0]
    console.log("✅ [ADMIN-MODERATE] Recipe moderated successfully:", {
      id: updatedRecipe.id,
      title: updatedRecipe.title,
      status: updatedRecipe.moderation_status,
      published: updatedRecipe.is_published,
      updated: updatedRecipe.updated_at,
    })

    // Verify the update worked by checking the database
    const verifyResult = await sql`
      SELECT moderation_status, is_published FROM recipes WHERE id = ${recipeId}
    `

    console.log("🔍 [ADMIN-MODERATE] Verification check:", verifyResult[0])

    return NextResponse.json({
      success: true,
      message: `Recipe "${updatedRecipe.title}" has been ${action}ed successfully`,
      recipe: updatedRecipe,
    })
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
