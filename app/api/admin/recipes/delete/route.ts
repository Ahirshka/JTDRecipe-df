import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest, isAdmin } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [ADMIN-RECIPE-DELETE] Recipe deletion request")

  try {
    // Get current user and verify authentication
    console.log("🔍 [ADMIN-RECIPE-DELETE] Verifying user authentication...")
    const currentUser = await getCurrentUserFromRequest(request)

    if (!currentUser) {
      console.log("❌ [ADMIN-RECIPE-DELETE] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [ADMIN-RECIPE-DELETE] User authenticated:", {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
    })

    // Check if user has admin privileges
    if (!isAdmin(currentUser)) {
      console.log("❌ [ADMIN-RECIPE-DELETE] User does not have admin privileges:", {
        username: currentUser.username,
        role: currentUser.role,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
          details: `Your role '${currentUser.role}' does not have admin privileges.`,
        },
        { status: 403 },
      )
    }

    console.log("✅ [ADMIN-RECIPE-DELETE] Admin access verified for:", currentUser.username)

    // Get recipe ID from request body
    const body = await request.json()
    const { recipeId } = body

    if (!recipeId) {
      console.log("❌ [ADMIN-RECIPE-DELETE] No recipe ID provided")
      return NextResponse.json({ success: false, error: "Recipe ID is required" }, { status: 400 })
    }

    console.log("🔍 [ADMIN-RECIPE-DELETE] Deleting recipe:", recipeId)

    // Get recipe details before deletion for logging
    const recipeDetails = await sql`
      SELECT id, title, author_id, status
      FROM recipes
      WHERE id = ${recipeId}
    `

    if (recipeDetails.length === 0) {
      console.log("❌ [ADMIN-RECIPE-DELETE] Recipe not found:", recipeId)
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = recipeDetails[0]
    console.log("📋 [ADMIN-RECIPE-DELETE] Recipe found:", {
      id: recipe.id,
      title: recipe.title,
      authorId: recipe.author_id,
      status: recipe.status,
    })

    // Delete the recipe (this will cascade to comments and ratings)
    await sql`
      DELETE FROM recipes
      WHERE id = ${recipeId}
    `

    console.log("✅ [ADMIN-RECIPE-DELETE] Recipe deleted successfully:", {
      recipeId: recipe.id,
      title: recipe.title,
      deletedBy: currentUser.username,
    })

    return NextResponse.json({
      success: true,
      message: "Recipe deleted successfully",
      data: {
        deletedRecipe: {
          id: recipe.id,
          title: recipe.title,
        },
        deletedBy: {
          id: currentUser.id,
          username: currentUser.username,
        },
        deletedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN-RECIPE-DELETE] Error:", error)
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
