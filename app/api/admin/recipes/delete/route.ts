import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(request: NextRequest) {
  console.log("🗑️ [DELETE-RECIPE] Starting recipe deletion request")
  console.log("🗑️ [DELETE-RECIPE] Request URL:", request.url)
  console.log("🗑️ [DELETE-RECIPE] Request method:", request.method)

  try {
    // Step 1: Parse request body
    console.log("🔍 [DELETE-RECIPE] Step 1: Parsing request body...")
    let body
    try {
      body = await request.json()
      console.log("📋 [DELETE-RECIPE] Request body parsed:", {
        recipeId: body.recipeId,
        reason: body.reason || "No reason provided",
      })
    } catch (parseError) {
      console.log("❌ [DELETE-RECIPE] Failed to parse request body:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          debug: "Failed to parse JSON body",
          details: parseError instanceof Error ? parseError.message : "Unknown parse error",
        },
        { status: 400 },
      )
    }

    const { recipeId, reason } = body

    // Step 2: Validate input
    console.log("🔍 [DELETE-RECIPE] Step 2: Validating input...")
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

    console.log("✅ [DELETE-RECIPE] Input validation passed")

    // Step 3: Authenticate user
    console.log("🔍 [DELETE-RECIPE] Step 3: Authenticating user...")
    let user
    try {
      user = await getCurrentUserFromRequest(request)
      console.log("🔍 [DELETE-RECIPE] getCurrentUserFromRequest called")
    } catch (authError) {
      console.error("❌ [DELETE-RECIPE] Authentication error:", authError)
      return NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          debug: "Error in getCurrentUserFromRequest",
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
          debug: "getCurrentUserFromRequest returned null",
        },
        { status: 401 },
      )
    }

    console.log("✅ [DELETE-RECIPE] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    // Step 4: Check permissions
    console.log("🔍 [DELETE-RECIPE] Step 4: Checking permissions...")
    const allowedRoles = ["admin", "owner", "moderator"]
    if (!allowedRoles.includes(user.role)) {
      console.log("❌ [DELETE-RECIPE] Insufficient permissions:", {
        userRole: user.role,
        allowedRoles: allowedRoles,
      })
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

    // Step 5: Check if recipe exists
    console.log("🔍 [DELETE-RECIPE] Step 5: Checking if recipe exists...")
    let recipeCheck
    try {
      recipeCheck = await sql`
        SELECT id, title, author_username, author_id, moderation_status, created_at
        FROM recipes 
        WHERE id = ${recipeId}
      `
      console.log("🔍 [DELETE-RECIPE] Recipe query executed, found:", recipeCheck.length, "records")
    } catch (queryError) {
      console.error("❌ [DELETE-RECIPE] Recipe lookup query failed:", queryError)
      return NextResponse.json(
        {
          success: false,
          error: "Database query failed",
          debug: "Failed to query recipe table",
          details: queryError instanceof Error ? queryError.message : "Unknown query error",
        },
        { status: 500 },
      )
    }

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
      created: recipe.created_at,
    })

    // Step 6: Delete related data first (cascade deletion)
    console.log("🔍 [DELETE-RECIPE] Step 6: Starting cascade deletion...")
    const deletionResults: any = {}

    try {
      // Delete ratings
      console.log("🗑️ [DELETE-RECIPE] Deleting ratings...")
      const ratingsDeleted = await sql`
        DELETE FROM ratings WHERE recipe_id = ${recipeId}
      `
      deletionResults.ratings = ratingsDeleted.length || 0
      console.log(`✅ [DELETE-RECIPE] Deleted ${deletionResults.ratings} ratings`)

      // Delete comments
      console.log("🗑️ [DELETE-RECIPE] Deleting comments...")
      const commentsDeleted = await sql`
        DELETE FROM comments WHERE recipe_id = ${recipeId}
      `
      deletionResults.comments = commentsDeleted.length || 0
      console.log(`✅ [DELETE-RECIPE] Deleted ${deletionResults.comments} comments`)

      // Delete from pending_recipes if exists
      try {
        console.log("🗑️ [DELETE-RECIPE] Deleting from pending_recipes...")
        const pendingDeleted = await sql`
          DELETE FROM pending_recipes WHERE recipe_id = ${recipeId}
        `
        deletionResults.pending = pendingDeleted.length || 0
        console.log(`✅ [DELETE-RECIPE] Deleted ${deletionResults.pending} pending entries`)
      } catch (pendingError) {
        console.log("ℹ️ [DELETE-RECIPE] No pending_recipes table or entries")
        deletionResults.pending = "table_not_exists"
      }

      // Delete from rejected_recipes if exists
      try {
        console.log("🗑️ [DELETE-RECIPE] Deleting from rejected_recipes...")
        const rejectedDeleted = await sql`
          DELETE FROM rejected_recipes WHERE recipe_id = ${recipeId}
        `
        deletionResults.rejected = rejectedDeleted.length || 0
        console.log(`✅ [DELETE-RECIPE] Deleted ${deletionResults.rejected} rejected entries`)
      } catch (rejectedError) {
        console.log("ℹ️ [DELETE-RECIPE] No rejected_recipes table or entries")
        deletionResults.rejected = "table_not_exists"
      }

      console.log("✅ [DELETE-RECIPE] Cascade deletion completed:", deletionResults)
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

    // Step 7: Delete the recipe itself
    console.log("🔍 [DELETE-RECIPE] Step 7: Deleting recipe...")
    let deleteResult
    try {
      deleteResult = await sql`
        DELETE FROM recipes WHERE id = ${recipeId}
      `
      console.log("✅ [DELETE-RECIPE] Recipe deletion query executed:", deleteResult)
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

    // Step 8: Verify deletion
    console.log("🔍 [DELETE-RECIPE] Step 8: Verifying deletion...")
    try {
      const verifyDeletion = await sql`
        SELECT id FROM recipes WHERE id = ${recipeId}
      `

      if (verifyDeletion.length === 0) {
        console.log("✅ [DELETE-RECIPE] Deletion verified - recipe no longer exists")
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
    } catch (verifyError) {
      console.error("❌ [DELETE-RECIPE] Verification query failed:", verifyError)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify deletion",
          debug: "Verification query failed",
          details: verifyError instanceof Error ? verifyError.message : "Unknown verify error",
        },
        { status: 500 },
      )
    }

    // Step 9: Log the deletion for audit purposes
    console.log("🔍 [DELETE-RECIPE] Step 9: Logging deletion...")
    try {
      // Create audit log table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS audit_log (
          id SERIAL PRIMARY KEY,
          action VARCHAR(50) NOT NULL,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(50) NOT NULL,
          user_role VARCHAR(50) NOT NULL,
          details JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `

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
            cascade_results: deletionResults,
          })},
          NOW()
        )
      `
      console.log("✅ [DELETE-RECIPE] Audit log created")
    } catch (auditError) {
      console.log("⚠️ [DELETE-RECIPE] Audit logging failed (non-critical):", auditError)
    }

    // Step 10: Return success response
    console.log("✅ [DELETE-RECIPE] Recipe deletion completed successfully")

    const successResponse = {
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
        cascadeResults: deletionResults,
      },
      debug: {
        steps_completed: [
          "parse_body",
          "validate_input",
          "authenticate_user",
          "check_permissions",
          "verify_recipe_exists",
          "cascade_deletion",
          "delete_recipe",
          "verify_deletion",
          "audit_logging",
        ],
        deletion_verified: true,
      },
    }

    return NextResponse.json(successResponse)
  } catch (error) {
    console.error("❌ [DELETE-RECIPE] Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        debug: "Unexpected error in delete recipe endpoint",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
      },
      { status: 500 },
    )
  }
}
