import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [DELETE-RECIPE-API] Starting recipe deletion request")

  try {
    // Get current user using server-auth
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [DELETE-RECIPE-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [DELETE-RECIPE-API] Found authenticated user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin/owner/moderator permissions
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [DELETE-RECIPE-API] Insufficient permissions:", user.role)
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get request body
    const body = await request.json()
    const { recipeId, reason } = body

    if (!recipeId) {
      console.log("❌ [DELETE-RECIPE-API] No recipe ID provided")
      return NextResponse.json({ success: false, error: "Recipe ID is required" }, { status: 400 })
    }

    console.log("🔍 [DELETE-RECIPE-API] Deleting recipe:", {
      recipeId,
      moderator: user.username,
      reason: reason || "No reason provided",
    })

    // Get recipe details before deletion for logging
    const recipes = await sql`
      SELECT id, title, author_id, author_username, moderation_status
      FROM recipes 
      WHERE id = ${recipeId}
    `

    if (recipes.length === 0) {
      console.log("❌ [DELETE-RECIPE-API] Recipe not found")
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = recipes[0]
    console.log("📋 [DELETE-RECIPE-API] Found recipe to delete:", {
      id: recipe.id,
      title: recipe.title,
      author: recipe.author_username,
    })

    // Delete related data first (ratings, comments, etc.)
    console.log("🗑️ [DELETE-RECIPE-API] Deleting related ratings...")
    await sql`DELETE FROM ratings WHERE recipe_id = ${recipeId}`

    console.log("🗑️ [DELETE-RECIPE-API] Deleting related comments...")
    await sql`DELETE FROM comments WHERE recipe_id = ${recipeId}`

    // Delete the recipe
    console.log("🗑️ [DELETE-RECIPE-API] Deleting recipe...")
    const deleteResult = await sql`
      DELETE FROM recipes 
      WHERE id = ${recipeId}
    `

    console.log("🗑️ [DELETE-RECIPE-API] Delete result:", deleteResult)

    // Log the deletion action (create table if it doesn't exist)
    try {
      console.log("📝 [DELETE-RECIPE-API] Logging deletion action...")

      // First, try to create the moderation_logs table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS moderation_logs (
          id SERIAL PRIMARY KEY,
          moderator_id INTEGER,
          moderator_username VARCHAR(255),
          action_type VARCHAR(50),
          target_type VARCHAR(50),
          target_id VARCHAR(255),
          target_title TEXT,
          reason TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `

      await sql`
        INSERT INTO moderation_logs (
          moderator_id, 
          moderator_username, 
          action_type, 
          target_type, 
          target_id, 
          target_title, 
          reason, 
          created_at
        ) VALUES (
          ${user.id}, 
          ${user.username}, 
          'delete', 
          'recipe', 
          ${recipeId}, 
          ${recipe.title}, 
          ${reason || "No reason provided"}, 
          NOW()
        )
      `
      console.log("📝 [DELETE-RECIPE-API] Logged deletion action successfully")
    } catch (logError) {
      console.log("⚠️ [DELETE-RECIPE-API] Failed to log action:", logError)
      // Continue even if logging fails
    }

    console.log("✅ [DELETE-RECIPE-API] Recipe deleted successfully")

    return NextResponse.json({
      success: true,
      message: `Recipe "${recipe.title}" has been deleted successfully`,
      deletedRecipe: {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
      },
    })
  } catch (error) {
    console.error("❌ [DELETE-RECIPE-API] Error deleting recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
