import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { initializeDatabase } from "@/lib/database-init"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-PENDING] Fetching pending recipes")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [ADMIN-PENDING] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin/moderator
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [ADMIN-PENDING] User lacks moderation permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-PENDING] Moderation permissions verified for user:", user.username)

    // Initialize database to ensure tables exist
    await initializeDatabase()

    // Import sql after database initialization
    const { sql } = await import("@/lib/neon")

    // Get pending recipes
    const pendingRecipes = await sql`
      SELECT 
        id,
        title,
        description,
        ingredients,
        instructions,
        prep_time,
        cook_time,
        servings,
        difficulty,
        cuisine_type,
        dietary_restrictions,
        author_username,
        moderation_status,
        is_published,
        created_at,
        updated_at
      FROM recipes 
      WHERE moderation_status = 'pending' OR moderation_status IS NULL
      ORDER BY created_at ASC
    `

    console.log("✅ [ADMIN-PENDING] Found pending recipes:", pendingRecipes.length)

    return NextResponse.json({
      success: true,
      recipes: pendingRecipes,
    })
  } catch (error) {
    console.error("❌ [ADMIN-PENDING] Error fetching pending recipes:", error)
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
