import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [DELETE-RECIPE-API] Starting recipe deletion request")

  try {
    // Get auth token from cookies
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.log("❌ [DELETE-RECIPE-API] No auth token provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify token and get user
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [DELETE-RECIPE-API] Invalid auth token")
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status 
      FROM users 
      WHERE id = ${payload.userId}
    `

    if (users.length === 0) {
      console.log("❌ [DELETE-RECIPE-API] User not found")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Check if user has admin/owner permissions
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

    console.log("🔍 [DELETE-RECIPE-API] Deleting recipe:", { recipeId, moderator: user.username, reason })

    // Get recipe details before deletion for logging
    const recipes = await sql`
      SELECT id, title, author_username, moderation_status
      FROM recipes 
      WHERE id = ${recipeId}
    `

    if (recipes.length === 0) {
      console.log("❌ [DELETE-RECIPE-API] Recipe not found")
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = recipes[0]
    console.log("📋 [DELETE-RECIPE-API] Found recipe to delete:", recipe.title)

    // Delete the recipe (this will cascade to related tables like ratings)
    const deleteResult = await sql`
      DELETE FROM recipes 
      WHERE id = ${recipeId}
    `

    console.log("🗑️ [DELETE-RECIPE-API] Delete result:", deleteResult)

    // Log the deletion action
    try {
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
      console.log("📝 [DELETE-RECIPE-API] Logged deletion action")
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
