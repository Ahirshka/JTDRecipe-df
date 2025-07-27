import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [DELETE-RECIPE-API] Starting recipe deletion request")
  console.log("🗑️ [DELETE-RECIPE-API] Request URL:", request.url)
  console.log("🗑️ [DELETE-RECIPE-API] Request method:", request.method)

  try {
    // Get current user using server-auth
    console.log("🔍 [DELETE-RECIPE-API] Getting current user...")
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [DELETE-RECIPE-API] No authenticated user found")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          debug: "No user found in getCurrentUserFromRequest",
        },
        { status: 401 },
      )
    }

    console.log("✅ [DELETE-RECIPE-API] Found authenticated user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin/owner/moderator permissions
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [DELETE-RECIPE-API] Insufficient permissions:", user.role)
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions",
          debug: `User role '${user.role}' is not authorized for deletion`,
        },
        { status: 403 },
      )
    }

    // Get request body
    let body
    try {
      body = await request.json()
      console.log("📋 [DELETE-RECIPE-API] Request body:", body)
    } catch (error) {
      console.log("❌ [DELETE-RECIPE-API] Failed to parse request body:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          debug: "Failed to parse JSON body",
        },
        { status: 400 },
      )
    }

    const { recipeId, reason } = body

    if (!recipeId) {
      console.log("❌ [DELETE-RECIPE-API] No recipe ID provided")
      return NextResponse.json(
        {
          success: false,
          error: "Recipe ID is required",
          debug: "recipeId field is missing from request body",
        },
        { status: 400 },
      )
    }

    console.log("🔍 [DELETE-RECIPE-API] Deleting recipe:", {
      recipeId,
      moderator: user.username,
      reason: reason || "No reason provided",
    })

    // Get recipe details before deletion for logging
    console.log("🔍 [DELETE-RECIPE-API] Looking up recipe details...")
    const recipes = await sql`
      SELECT id, title, author_id, author_username, moderation_status
      FROM recipes 
      WHERE id = ${recipeId}
    `

    if (recipes.length === 0) {
      console.log("❌ [DELETE-RECIPE-API] Recipe not found")
      return NextResponse.json(
        {
          success: false,
          error: "Recipe not found",
          debug: `No recipe found with ID: ${recipeId}`,
        },
        { status: 404 },
      )
    }

    const recipe = recipes[0]
    console.log("📋 [DELETE-RECIPE-API] Found recipe to delete:", {
      id: recipe.id,
      title: recipe.title,
      author: recipe.author_username,
      status: recipe.moderation_status,
    })

    // Delete related data first (cascade deletion)
    console.log("🗑️ [DELETE-RECIPE-API] Starting cascade deletion...")

    // Delete ratings
    console.log("🗑️ [DELETE-RECIPE-API] Deleting related ratings...")
    const ratingsResult = await sql`DELETE FROM ratings WHERE recipe_id = ${recipeId}`
    console.log("🗑️ [DELETE-RECIPE-API] Ratings deleted:", ratingsResult)

    // Delete comments
    console.log("🗑️ [DELETE-RECIPE-API] Deleting related comments...")
    const commentsResult = await sql`DELETE FROM comments WHERE recipe_id = ${recipeId}`
    console.log("🗑️ [DELETE-RECIPE-API] Comments deleted:", commentsResult)

    // Delete the recipe
    console.log("🗑️ [DELETE-RECIPE-API] Deleting recipe...")
    const deleteResult = await sql`
      DELETE FROM recipes 
      WHERE id = ${recipeId}
    `
    console.log("🗑️ [DELETE-RECIPE-API] Recipe delete result:", deleteResult)

    // Verify deletion
    const verifyResult = await sql`SELECT COUNT(*) as count FROM recipes WHERE id = ${recipeId}`
    const stillExists = Number.parseInt(verifyResult[0].count) > 0

    if (stillExists) {
      console.log("❌ [DELETE-RECIPE-API] Recipe still exists after deletion attempt")
      return NextResponse.json(
        {
          success: false,
          error: "Recipe deletion failed - recipe still exists",
          debug: "Recipe was not actually deleted from database",
        },
        { status: 500 },
      )
    }

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
      debug: {
        ratingsDeleted: ratingsResult,
        commentsDeleted: commentsResult,
        recipeDeleted: deleteResult,
        verificationPassed: !stillExists,
      },
    })
  } catch (error) {
    console.error("❌ [DELETE-RECIPE-API] Error deleting recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete recipe",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          stack: error instanceof Error ? error.stack : "No stack trace",
          name: error instanceof Error ? error.name : "Unknown error type",
        },
      },
      { status: 500 },
    )
  }
}
