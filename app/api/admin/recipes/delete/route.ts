import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [DELETE-RECIPE] Starting recipe deletion process")

  try {
    // Step 1: Parse request body
    console.log("🔍 [DELETE-RECIPE] Step 1: Parsing request body...")
    const body = await request.json()
    const { recipeId, reason } = body

    if (!recipeId) {
      console.log("❌ [DELETE-RECIPE] Recipe ID is required")
      return NextResponse.json({ success: false, error: "Recipe ID is required" }, { status: 400 })
    }

    console.log("✅ [DELETE-RECIPE] Request parsed:", { recipeId, reason })

    // Step 2: Authenticate user
    console.log("🔍 [DELETE-RECIPE] Step 2: Authenticating user...")
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [DELETE-RECIPE] Authentication failed - no user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [DELETE-RECIPE] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Step 3: Check permissions
    console.log("🔍 [DELETE-RECIPE] Step 3: Checking permissions...")
    const allowedRoles = ["admin", "owner", "moderator"]

    if (!allowedRoles.includes(user.role)) {
      console.log("❌ [DELETE-RECIPE] Insufficient permissions:", {
        userRole: user.role,
        allowedRoles,
      })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [DELETE-RECIPE] Permissions verified")

    // Step 4: Check if recipe exists
    console.log("🔍 [DELETE-RECIPE] Step 4: Checking if recipe exists...")
    const recipeResult = await sql`
      SELECT id, title, author_username, moderation_status
      FROM recipes
      WHERE id = ${recipeId}
    `

    if (recipeResult.length === 0) {
      console.log("❌ [DELETE-RECIPE] Recipe not found:", recipeId)
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = recipeResult[0]
    console.log("✅ [DELETE-RECIPE] Recipe found:", {
      id: recipe.id,
      title: recipe.title,
      author: recipe.author_username,
    })

    // Step 5: Delete related ratings
    console.log("🔍 [DELETE-RECIPE] Step 5: Deleting related ratings...")
    try {
      const ratingsResult = await sql`
        DELETE FROM ratings
        WHERE recipe_id = ${recipeId}
      `
      console.log("✅ [DELETE-RECIPE] Ratings deleted")
    } catch (error) {
      console.log("⚠️ [DELETE-RECIPE] Ratings table might not exist or no ratings to delete")
    }

    // Step 6: Delete related comments
    console.log("🔍 [DELETE-RECIPE] Step 6: Deleting related comments...")
    try {
      const commentsResult = await sql`
        DELETE FROM comments
        WHERE recipe_id = ${recipeId}
      `
      console.log("✅ [DELETE-RECIPE] Comments deleted")
    } catch (error) {
      console.log("⚠️ [DELETE-RECIPE] Comments table might not exist or no comments to delete")
    }

    // Step 7: Create audit log entry
    console.log("🔍 [DELETE-RECIPE] Step 7: Creating audit log entry...")
    try {
      await sql`
        INSERT INTO recipe_deletion_audit (
          recipe_id,
          recipe_title,
          deleted_by_user_id,
          deleted_by_username,
          deletion_reason,
          recipe_data
        ) VALUES (
          ${recipeId},
          ${recipe.title},
          ${user.id},
          ${user.username},
          ${reason || "No reason provided"},
          ${JSON.stringify(recipe)}
        )
      `
      console.log("✅ [DELETE-RECIPE] Audit log entry created")
    } catch (error) {
      console.log("⚠️ [DELETE-RECIPE] Could not create audit log:", error)
    }

    // Step 8: Delete the recipe
    console.log("🔍 [DELETE-RECIPE] Step 8: Deleting recipe...")
    const deleteResult = await sql`
      DELETE FROM recipes
      WHERE id = ${recipeId}
    `

    console.log("✅ [DELETE-RECIPE] Recipe deleted successfully")

    // Step 9: Verify deletion
    console.log("🔍 [DELETE-RECIPE] Step 9: Verifying deletion...")
    const verifyResult = await sql`
      SELECT id FROM recipes WHERE id = ${recipeId}
    `

    if (verifyResult.length > 0) {
      console.log("❌ [DELETE-RECIPE] Deletion verification failed - recipe still exists")
      return NextResponse.json({ success: false, error: "Recipe deletion verification failed" }, { status: 500 })
    }

    console.log("✅ [DELETE-RECIPE] Deletion verified successfully")

    // Step 10: Return success response
    console.log("🔍 [DELETE-RECIPE] Step 10: Returning success response...")
    const response = {
      success: true,
      message: "Recipe deleted successfully",
      data: {
        deletedRecipe: {
          id: recipe.id,
          title: recipe.title,
          author: recipe.author_username,
        },
        deletedBy: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        reason: reason || "No reason provided",
        timestamp: new Date().toISOString(),
      },
    }

    console.log("✅ [DELETE-RECIPE] Recipe deletion completed successfully")
    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [DELETE-RECIPE] Recipe deletion failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Recipe deletion failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
