import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { sql, initializeDatabase } from "@/lib/neon"

export async function GET() {
  try {
    console.log("🔍 Fetching pending recipes for admin review...")
    await initializeDatabase()

    // Check if user is authenticated and has admin privileges
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "owner" && user.role !== "moderator") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log(`✅ Admin user authenticated: ${user.username} (${user.role})`)

    // Fetch pending recipes with full details
    const pendingRecipes = await sql`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.category,
        r.difficulty,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.servings,
        r.image_url,
        r.created_at,
        r.updated_at,
        r.moderation_status,
        r.moderation_notes,
        r.rejection_reason,
        u.id as author_id,
        u.username as author_username,
        u.email as author_email,
        u.role as author_role,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'ingredient', ri.ingredient,
              'amount', ri.amount,
              'unit', ri.unit
            )
          ) FILTER (WHERE ri.ingredient IS NOT NULL), 
          '[]'::json
        ) as ingredients,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'instruction', inst.instruction,
              'step_number', inst.step_number
            )
            ORDER BY inst.step_number
          ) FILTER (WHERE inst.instruction IS NOT NULL), 
          '[]'::json
        ) as instructions,
        COALESCE(
          array_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL), 
          ARRAY[]::text[]
        ) as tags
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.moderation_status = 'pending'
      GROUP BY r.id, u.id, u.username, u.email, u.role
      ORDER BY r.created_at ASC
    `

    console.log(`✅ Found ${pendingRecipes.length} pending recipes`)

    return NextResponse.json({
      success: true,
      recipes: pendingRecipes,
      count: pendingRecipes.length,
    })
  } catch (error) {
    console.error("❌ Error fetching pending recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pending recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("🔍 Processing recipe moderation action...")
    await initializeDatabase()

    // Check if user is authenticated and has admin privileges
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "owner" && user.role !== "moderator") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { recipeId, action, notes, rejectionReason } = await request.json()

    if (!recipeId || !action) {
      return NextResponse.json({ success: false, error: "Recipe ID and action are required" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 },
      )
    }

    console.log(`🔄 ${action}ing recipe ${recipeId} by ${user.username}`)

    // Update recipe moderation status
    const updateData: any = {
      moderation_status: action === "approve" ? "approved" : "rejected",
      is_published: action === "approve",
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (notes) {
      updateData.moderation_notes = notes
    }

    if (action === "reject" && rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    await sql`
      UPDATE recipes 
      SET 
        moderation_status = ${updateData.moderation_status},
        is_published = ${updateData.is_published},
        moderated_by = ${updateData.moderated_by},
        moderated_at = ${updateData.moderated_at},
        updated_at = ${updateData.updated_at},
        moderation_notes = ${updateData.moderation_notes || null},
        rejection_reason = ${updateData.rejection_reason || null}
      WHERE id = ${recipeId}
    `

    console.log(`✅ Recipe ${recipeId} ${action}ed successfully`)

    return NextResponse.json({
      success: true,
      message: `Recipe ${action}ed successfully`,
      action,
      recipeId,
    })
  } catch (error) {
    console.error("❌ Error processing recipe moderation:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process moderation action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
