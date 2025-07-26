import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-PENDING] Getting pending recipes")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [ADMIN-PENDING] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin/owner
    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [ADMIN-PENDING] User lacks admin permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-PENDING] Admin permissions verified for user:", user.username)

    // Get pending recipes with author information
    const result = await sql`
      SELECT 
        r.*,
        u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at ASC
    `

    console.log(`✅ [ADMIN-PENDING] Retrieved ${result.length} pending recipes`)

    // Log each recipe for debugging
    result.forEach((recipe, index) => {
      console.log(`📋 [ADMIN-PENDING] Recipe ${index + 1}:`, {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        status: recipe.moderation_status,
        created: recipe.created_at,
      })
    })

    return NextResponse.json({
      success: true,
      recipes: result,
    })
  } catch (error) {
    console.error("❌ [ADMIN-PENDING] Error getting pending recipes:", error)
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
