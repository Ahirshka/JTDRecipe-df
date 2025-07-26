import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-API] Recipe moderation started")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [ADMIN-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin/owner
    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [ADMIN-API] User lacks admin permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-API] Admin permissions verified for user:", user.username)

    // Parse request body
    const body = await request.json()
    const { recipeId, action, notes, edits } = body

    console.log("📝 [ADMIN-API] Moderation request:", {
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

    // Check if recipe exists
    const existingRecipe = await sql`
      SELECT * FROM recipes WHERE id = ${recipeId}
    `

    if (existingRecipe.length === 0) {
      console.log("❌ [ADMIN-API] Recipe not found:", recipeId)
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    console.log("✅ [ADMIN-API] Recipe found:", existingRecipe[0].title)

    // Prepare update data
    const moderationStatus = action === "approve" ? "approved" : "rejected"
    const isPublished = action === "approve"
    const moderationNotes = notes || null

    let updateQuery
    let updateParams: any = {
      moderation_status: moderationStatus,
      moderation_notes: moderationNotes,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    }

    // If approving with edits, include the edits
    if (action === "approve" && edits) {
      console.log("📝 [ADMIN-API] Applying edits to recipe")

      updateParams = {
        ...updateParams,
        title: edits.title || existingRecipe[0].title,
        description: edits.description || existingRecipe[0].description,
        category: edits.category || existingRecipe[0].category,
        difficulty: edits.difficulty || existingRecipe[0].difficulty,
      }

      // Handle ingredients and instructions if provided
      if (edits.ingredients) {
        updateParams.ingredients = JSON.stringify(
          typeof edits.ingredients === "string"
            ? edits.ingredients.split("\n").filter((i) => i.trim())
            : edits.ingredients,
        )
      }

      if (edits.instructions) {
        updateParams.instructions = JSON.stringify(
          typeof edits.instructions === "string"
            ? edits.instructions.split("\n").filter((i) => i.trim())
            : edits.instructions,
        )
      }
    }

    console.log("🔄 [ADMIN-API] Updating recipe with:", {
      status: updateParams.moderation_status,
      published: updateParams.is_published,
      hasEdits: action === "approve" && !!edits,
    })

    // Update recipe
    const result = await sql`
      UPDATE recipes 
      SET 
        moderation_status = ${updateParams.moderation_status},
        moderation_notes = ${updateParams.moderation_notes},
        is_published = ${updateParams.is_published},
        title = ${updateParams.title || existingRecipe[0].title},
        description = ${updateParams.description || existingRecipe[0].description},
        category = ${updateParams.category || existingRecipe[0].category},
        difficulty = ${updateParams.difficulty || existingRecipe[0].difficulty},
        ingredients = ${updateParams.ingredients ? updateParams.ingredients + "::jsonb" : existingRecipe[0].ingredients},
        instructions = ${updateParams.instructions ? updateParams.instructions + "::jsonb" : existingRecipe[0].instructions},
        updated_at = ${updateParams.updated_at}
      WHERE id = ${recipeId}
      RETURNING id, title, moderation_status, is_published
    `

    if (result.length === 0) {
      console.log("❌ [ADMIN-API] Failed to update recipe")
      return NextResponse.json({ success: false, error: "Failed to update recipe" }, { status: 500 })
    }

    const updatedRecipe = result[0]
    console.log("✅ [ADMIN-API] Recipe moderated successfully:", {
      id: updatedRecipe.id,
      title: updatedRecipe.title,
      status: updatedRecipe.moderation_status,
      published: updatedRecipe.is_published,
    })

    return NextResponse.json({
      success: true,
      message: `Recipe "${updatedRecipe.title}" has been ${action}ed successfully`,
      recipe: updatedRecipe,
    })
  } catch (error) {
    console.error("❌ [ADMIN-API] Recipe moderation error:", error)
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
