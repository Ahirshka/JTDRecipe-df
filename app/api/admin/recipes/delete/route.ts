import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [DELETE-RECIPE] Starting recipe deletion request")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [DELETE-RECIPE] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [DELETE-RECIPE] No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session and get user
    console.log("🔍 [DELETE-RECIPE] Verifying session...")
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [DELETE-RECIPE] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [DELETE-RECIPE] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [DELETE-RECIPE] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [DELETE-RECIPE] Admin access verified")

    // Parse request body
    const body = await request.json()
    const { recipeId } = body

    console.log("📝 [DELETE-RECIPE] Deletion request:", { recipeId })

    if (!recipeId) {
      return NextResponse.json({ success: false, error: "Recipe ID is required" }, { status: 400 })
    }

    // Get recipe details before deletion for audit log
    console.log("🔍 [DELETE-RECIPE] Getting recipe details for audit...")
    const recipeResult = await sql`
      SELECT id, title, author_id, author_username, moderation_status, created_at
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
      status: recipe.moderation_status,
    })

    // Create audit log table if it doesn't exist
    console.log("🔧 [DELETE-RECIPE] Ensuring audit log table exists...")
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_deletion_audit (
        id SERIAL PRIMARY KEY,
        recipe_id VARCHAR(50) NOT NULL,
        recipe_title VARCHAR(255) NOT NULL,
        recipe_author_id INTEGER NOT NULL,
        recipe_author_username VARCHAR(50) NOT NULL,
        deleted_by_id INTEGER NOT NULL,
        deleted_by_username VARCHAR(50) NOT NULL,
        deletion_reason TEXT DEFAULT 'Admin deletion',
        deleted_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Start transaction for deletion
    console.log("🔄 [DELETE-RECIPE] Starting deletion transaction...")

    // Delete related ratings first
    console.log("🗑️ [DELETE-RECIPE] Deleting related ratings...")
    const ratingsDeleted = await sql`
      DELETE FROM ratings WHERE recipe_id = ${recipeId}
    `
    console.log(`✅ [DELETE-RECIPE] Deleted ${ratingsDeleted.length} ratings`)

    // Delete related comments
    console.log("🗑️ [DELETE-RECIPE] Deleting related comments...")
    const commentsDeleted = await sql`
      DELETE FROM comments WHERE recipe_id = ${recipeId}
    `
    console.log(`✅ [DELETE-RECIPE] Deleted ${commentsDeleted.length} comments`)

    // Create audit log entry
    console.log("📝 [DELETE-RECIPE] Creating audit log entry...")
    await sql`
      INSERT INTO recipe_deletion_audit (
        recipe_id, recipe_title, recipe_author_id, recipe_author_username,
        deleted_by_id, deleted_by_username, deletion_reason, deleted_at
      )
      VALUES (
        ${recipe.id}, ${recipe.title}, ${recipe.author_id}, ${recipe.author_username},
        ${user.id}, ${user.username}, 'Admin deletion via management panel', NOW()
      )
    `
    console.log("✅ [DELETE-RECIPE] Audit log entry created")

    // Delete the recipe
    console.log("🗑️ [DELETE-RECIPE] Deleting recipe...")
    const deletionResult = await sql`
      DELETE FROM recipes WHERE id = ${recipeId}
    `

    if (deletionResult.length === 0) {
      console.log("❌ [DELETE-RECIPE] Recipe deletion failed - no rows affected")
      return NextResponse.json({ success: false, error: "Recipe deletion failed" }, { status: 500 })
    }

    console.log("✅ [DELETE-RECIPE] Recipe deleted successfully")

    // Verify deletion
    const verifyResult = await sql`
      SELECT COUNT(*) as count FROM recipes WHERE id = ${recipeId}
    `
    const stillExists = Number.parseInt(verifyResult[0]?.count || "0") > 0

    if (stillExists) {
      console.log("❌ [DELETE-RECIPE] Recipe still exists after deletion attempt")
      return NextResponse.json({ success: false, error: "Recipe deletion verification failed" }, { status: 500 })
    }

    console.log("🎉 [DELETE-RECIPE] Recipe deletion completed and verified")

    return NextResponse.json({
      success: true,
      message: `Recipe "${recipe.title}" deleted successfully`,
      deletedRecipe: {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
      },
      deletedBy: user.username,
      deletedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [DELETE-RECIPE] Error:", error)
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
