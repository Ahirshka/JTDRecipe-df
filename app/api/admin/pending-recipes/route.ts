import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import { getCurrentUser } from "@/lib/server-auth"
import { hasPermission } from "@/lib/auth"

export async function GET() {
  try {
    console.log("🔍 Admin: Fetching pending recipes...")
    await initializeDatabase()

    // Check if user is authenticated and has admin permissions
    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ Admin: No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    if (!hasPermission(user.role, "moderator")) {
      console.log(`❌ Admin: User ${user.username} lacks moderation permissions`)
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log(`✅ Admin: User ${user.username} fetching pending recipes`)

    // Fetch pending recipes with all details
    const pendingRecipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        u.email as author_email,
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
      GROUP BY r.id, u.username, u.email
      ORDER BY r.created_at DESC
    `

    console.log(`✅ Admin: Found ${pendingRecipes.length} pending recipes`)

    return NextResponse.json({
      success: true,
      recipes: pendingRecipes,
      count: pendingRecipes.length,
    })
  } catch (error) {
    console.error("❌ Admin: Error fetching pending recipes:", error)
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
