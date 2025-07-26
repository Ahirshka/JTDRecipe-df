import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: Request) {
  try {
    console.log("🔄 [ADMIN-PENDING] Getting pending recipes...")

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
        r.id,
        r.title,
        r.description,
        r.category,
        r.difficulty,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.servings,
        r.ingredients,
        r.instructions,
        r.image_url,
        r.created_at,
        r.moderation_status,
        u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at ASC
    `

    console.log(`📋 [ADMIN-PENDING] Found ${result.length} pending recipes`)

    // Log each recipe for debugging
    result.forEach((recipe: any, index: number) => {
      console.log(`📝 [ADMIN-PENDING] Recipe ${index + 1}:`, {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        status: recipe.moderation_status,
        created: recipe.created_at,
      })
    })

    const recipes = result.map((recipe: any) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      author_username: recipe.author_username,
      category: recipe.category,
      difficulty: recipe.difficulty,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      image_url: recipe.image_url,
      created_at: recipe.created_at,
    }))

    return NextResponse.json({
      success: true,
      recipes,
      count: recipes.length,
    })
  } catch (error) {
    console.error("❌ [ADMIN-PENDING] Failed to get pending recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get pending recipes",
        details: error instanceof Error ? error.message : "Unknown error",
        recipes: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
