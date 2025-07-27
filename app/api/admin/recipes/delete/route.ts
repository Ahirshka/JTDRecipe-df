import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [DELETE-RECIPE] Starting recipe deletion request")

  try {
    // Parse request body
    const body = await request.json()
    const { recipeId, reason } = body

    console.log("🗑️ [DELETE-RECIPE] Request data:", { recipeId, reason })

    // Validate input
    if (!recipeId) {
      console.log("❌ [DELETE-RECIPE] Missing recipe ID")
      return NextResponse.json(
        {
          success: false,
          error: "Recipe ID is required",
          debug: "Missing recipeId in request body",
        },
        { status: 400 },
      )
    }

    // Step 1: Authenticate user
    console.log("🔍 [DELETE-RECIPE] Step 1: Authenticating user...")
    let user
    try {
      user = await getCurrentUserFromRequest(request)
    } catch (authError) {
      console.error("❌ [DELETE-RECIPE] Authentication error:", authError)
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          debug: "Authentication failed in getCurrentUserFromRequest",
          details: authError instanceof Error ? authError.message : "Unknown auth error",
        },
        { status: 401 },
      )
    }

    if (!user) {
      console.log("❌ [DELETE-RECIPE] No user found")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          debug: "No user found in getCurrentUserFromRequest",
        },
        { status: 401 },
      )
    }

    console.log("✅ [DELETE-RECIPE] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Step 2: Check permissions
    console.log("🔍 [DELETE-RECIPE] Step 2: Checking permissions...")
    const allowedRoles = ["admin", "owner", "moderator"]
    if (!allowedRoles.includes(user.role)) {
      console.log("❌ [DELETE-RECIPE] Insufficient permissions:", user.role)
      return NextResponse.json(
        {
          success: false,
          error: "Insufficient permissions",
          debug: `User role '${user.role}' not in allowed roles: ${allowedRoles.join(", ")}`,
        },
        { status: 403 },
      )
    }

    console.log("✅ [DELETE-RECIPE] User has deletion permissions")

    // Step 3: Check if recipe exists
    console.log("🔍 [DELETE-RECIPE] Step 3: Checking if recipe exists...")
    const recipeCheck = await sql`
      SELECT id, title, author_username, author_id, moderation_status
      FROM recipes 
      WHERE id = ${recipeId}
    `

    if (recipeCheck.length === 0) {
      console.log("❌ [DELETE-RECIPE] Recipe not found:", recipeId)
      return NextResponse.json(
        {
          success: false,
          error: "Recipe not found",
          debug: `No recipe found with ID: ${recipeId}`,
        },
        { status: 404 },
      )
    }

    const recipe = recipeCheck[0]
    console.log("✅ [DELETE-RECIPE] Recipe found:", {
      id: recipe.id,
      title: recipe.title,
      author: recipe.author_username,
      status: recipe.moderation_status,
    })

    // Step 4: Delete related data first (cascade deletion)
    console.log("🔍 [DELETE-RECIPE] Step 4: Deleting related data...")

    try {
      // Delete ratings
      const ratingsDeleted = await sql`
        DELETE FROM ratings WHERE recipe_id = ${recipeId}
      `
      console.log(`✅ [DELETE-RECIPE] Deleted ${ratingsDeleted.length} ratings`)

      // Delete comments
      const commentsDeleted = await sql`
        DELETE FROM comments WHERE recipe_id = ${recipeId}
      `
      console.log(`✅ [DELETE-RECIPE] Deleted ${commentsDeleted.length} comments`)

      // Delete from pending_recipes if exists
      try {
        const pendingDeleted = await sql`
          DELETE FROM pending_recipes WHERE recipe_id = ${recipeId}
        `
        console.log(`✅ [DELETE-RECIPE] Deleted ${pendingDeleted.length} pending entries`)
      } catch (pendingError) {
        console.log("ℹ️ [DELETE-RECIPE] No pending_recipes table or entries")
      }

      // Delete from rejected_recipes if exists
      try {
        const rejectedDeleted = await sql`
          DELETE FROM rejected_recipes WHERE recipe_id = ${recipeId}
        `
        console.log(`✅ [DELETE-RECIPE] Deleted ${rejectedDeleted.length} rejected entries`)
      } catch (rejectedError) {
        console.log("ℹ️ [DELETE-RECIPE] No rejected_recipes table or entries")
      }
    } catch (cascadeError) {
      console.error("❌ [DELETE-RECIPE] Cascade deletion failed:", cascadeError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete related data",
          debug: "Cascade deletion failed",
          details: cascadeError instanceof Error ? cascadeError.message : "Unknown cascade error",
        },
        { status: 500 },
      )
    }

    // Step 5: Delete the recipe itself
    console.log("🔍 [DELETE-RECIPE] Step 5: Deleting recipe...")
    try {
      const deleteResult = await sql`
        DELETE FROM recipes WHERE id = ${recipeId}
      `

      console.log("✅ [DELETE-RECIPE] Recipe deleted successfully:", deleteResult)

      // Step 6: Log the deletion for audit purposes
      console.log("🔍 [DELETE-RECIPE] Step 6: Logging deletion...")
      try {
        await sql`
          INSERT INTO audit_log (
            action, 
            table_name, 
            record_id, 
            user_id, 
            user_role, 
            details, 
            created_at
          ) VALUES (
            'DELETE',
            'recipes',
            ${recipeId},
            ${user.id},
            ${user.role},
            ${JSON.stringify({
              recipe_title: recipe.title,
              recipe_author: recipe.author_username,
              deletion_reason: reason || "No reason provided",
              deleted_by: user.username,
            })},
            NOW()
          )
        `
        console.log("✅ [DELETE-RECIPE] Audit log created")
      } catch (auditError) {
        console.log("⚠️ [DELETE-RECIPE] Audit logging failed (non-critical):", auditError)
      }

      // Step 7: Verify deletion
      console.log("🔍 [DELETE-RECIPE] Step 7: Verifying deletion...")
      const verifyDeletion = await sql`
        SELECT id FROM recipes WHERE id = ${recipeId}
      `

      if (verifyDeletion.length === 0) {
        console.log("✅ [DELETE-RECIPE] Deletion verified - recipe no longer exists")

        return NextResponse.json({
          success: true,
          message: `Recipe "${recipe.title}" has been successfully deleted`,
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
        })
      } else {
        console.log("❌ [DELETE-RECIPE] Deletion verification failed - recipe still exists")
        return NextResponse.json(
          {
            success: false,
            error: "Recipe deletion verification failed",
            debug: "Recipe still exists after deletion attempt",
          },
          { status: 500 },
        )
      }
    } catch (deleteError) {
      console.error("❌ [DELETE-RECIPE] Recipe deletion failed:", deleteError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete recipe",
          debug: "Recipe deletion query failed",
          details: deleteError instanceof Error ? deleteError.message : "Unknown delete error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [DELETE-RECIPE] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: "Unexpected error in delete recipe endpoint",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
