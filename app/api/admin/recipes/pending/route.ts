import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-API] Getting pending recipes")

    // Check authentication using the correct cookie name
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [ADMIN-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    console.log("✅ [ADMIN-API] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user is admin/owner
    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [ADMIN-API] User lacks admin permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-API] Admin permissions verified")

    // Get pending recipes with detailed logging
    console.log("🔍 [ADMIN-API] Querying pending recipes from database...")

    const recipes = await sql`
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at ASC
    `

    console.log(`📋 [ADMIN-API] Found ${recipes.length} pending recipes`)

    // Log each recipe for debugging
    recipes.forEach((recipe, index) => {
      console.log(`📝 [ADMIN-API] Recipe ${index + 1}:`, {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        status: recipe.moderation_status,
        created_at: recipe.created_at,
      })
    })

    const response = {
      success: true,
      recipes: recipes,
      count: recipes.length,
      timestamp: new Date().toISOString(),
    }

    console.log("📤 [ADMIN-API] Sending response:", {
      success: response.success,
      count: response.count,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [ADMIN-API] Get pending recipes error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
