import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [ADMIN-DELETE-RECIPE] Recipe deletion request received")

  try {
    // Check authentication
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [ADMIN-DELETE-RECIPE] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [ADMIN-DELETE-RECIPE] No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session and get user
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [ADMIN-DELETE-RECIPE] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [ADMIN-DELETE-RECIPE] User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [ADMIN-DELETE-RECIPE] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [ADMIN-DELETE-RECIPE] Admin access verified")

    // Get recipe ID from request body
    const body = await request.json()
    const { recipeId, reason } = body

    console.log("🔍 [ADMIN-DELETE-RECIPE] Deletion request:", {
      recipeId,
      reason: reason || "No reason provided",
      deletedBy: user.username,
    })

    if (!recipeId) {
      console.log("❌ [ADMIN-DELETE-RECIPE] No recipe ID provided")
      return NextResponse.json({ success: false, error: "Recipe ID is required" }, { status: 400 })
    }

    // Ensure audit table exists
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_deletions (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        recipe_title VARCHAR(255),
        recipe_author_id INTEGER,
        deleted_by INTEGER REFERENCES users(id),
        deletion_reason TEXT,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Get recipe details before deletion for audit log
    console.log("📋 [ADMIN-DELETE-RECIPE] Getting recipe details for audit...")
    const recipeDetails = await sql`
      SELECT id, title, author_id, status
      FROM recipes
      WHERE id = ${recipeId}
    `

    if (recipeDetails.length === 0) {
      console.log("❌ [ADMIN-DELETE-RECIPE] Recipe not found:", recipeId)
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    const recipe = recipeDetails[0]
    console.log("✅ [ADMIN-DELETE-RECIPE] Recipe found for deletion:", {
      id: recipe.id,
      title: recipe.title,
      status: recipe.status,
      authorId: recipe.author_id,
    })

    // Start deletion process
    console.log("🗑️ [ADMIN-DELETE-RECIPE] Starting deletion process...")

    // Delete related ratings
    console.log("🗑️ [ADMIN-DELETE-RECIPE] Deleting related ratings...")
    const deletedRatings = await sql`
      DELETE FROM ratings
      WHERE recipe_id = ${recipeId}
    `
    console.log("✅ [ADMIN-DELETE-RECIPE] Deleted ratings:", deletedRatings.length)

    // Delete related comments
    console.log("🗑️ [ADMIN-DELETE-RECIPE] Deleting related comments...")
    const deletedComments = await sql`
      DELETE FROM comments
      WHERE recipe_id = ${recipeId}
    `
    console.log("✅ [ADMIN-DELETE-RECIPE] Deleted comments:", deletedComments.length)

    // Create audit log entry
    console.log("📝 [ADMIN-DELETE-RECIPE] Creating audit log entry...")
    await sql`
      INSERT INTO recipe_deletions (
        recipe_id,
        recipe_title,
        recipe_author_id,
        deleted_by,
        deletion_reason
      ) VALUES (
        ${recipe.id},
        ${recipe.title},
        ${recipe.author_id},
        ${user.id},
        ${reason || "No reason provided"}
      )
    `
    console.log("✅ [ADMIN-DELETE-RECIPE] Audit log entry created")

    // Delete the recipe
    console.log("🗑️ [ADMIN-DELETE-RECIPE] Deleting recipe...")
    const deletedRecipe = await sql`
      DELETE FROM recipes
      WHERE id = ${recipeId}
    `

    if (deletedRecipe.length === 0) {
      console.log("❌ [ADMIN-DELETE-RECIPE] Failed to delete recipe")
      return NextResponse.json({ success: false, error: "Failed to delete recipe" }, { status: 500 })
    }

    console.log("✅ [ADMIN-DELETE-RECIPE] Recipe deleted successfully")

    // Verify deletion
    const verifyDeletion = await sql`
      SELECT id FROM recipes WHERE id = ${recipeId}
    `

    if (verifyDeletion.length > 0) {
      console.log("❌ [ADMIN-DELETE-RECIPE] Recipe still exists after deletion attempt")
      return NextResponse.json({ success: false, error: "Recipe deletion verification failed" }, { status: 500 })
    }

    console.log("✅ [ADMIN-DELETE-RECIPE] Deletion verified successfully")

    const response = {
      success: true,
      message: "Recipe deleted successfully",
      deletedRecipe: {
        id: recipe.id,
        title: recipe.title,
        authorId: recipe.author_id,
      },
      deletedBy: {
        id: user.id,
        username: user.username,
      },
      reason: reason || "No reason provided",
      deletedAt: new Date().toISOString(),
      relatedDataDeleted: {
        ratings: deletedRatings.length,
        comments: deletedComments.length,
      },
    }

    console.log("✅ [ADMIN-DELETE-RECIPE] Deletion completed successfully:", {
      recipeId: recipe.id,
      title: recipe.title,
      deletedBy: user.username,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [ADMIN-DELETE-RECIPE] Error:", error)
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
