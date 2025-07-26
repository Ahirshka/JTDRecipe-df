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

    // Get pending recipes
    const pendingRecipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        u.email as author_email
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at ASC
    `

    console.log(`📋 [ADMIN-PENDING] Found ${pendingRecipes.length} pending recipes`)

    // Process recipes for frontend
    const processedRecipes = pendingRecipes.map((recipe) => {
      // Parse JSON fields safely
      let ingredients = []
      let instructions = []
      let tags = []

      try {
        ingredients = typeof recipe.ingredients === "string" ? JSON.parse(recipe.ingredients) : recipe.ingredients || []
      } catch (e) {
        console.warn(`Failed to parse ingredients for recipe ${recipe.id}:`, e)
        ingredients = []
      }

      try {
        instructions =
          typeof recipe.instructions === "string" ? JSON.parse(recipe.instructions) : recipe.instructions || []
      } catch (e) {
        console.warn(`Failed to parse instructions for recipe ${recipe.id}:`, e)
        instructions = []
      }

      try {
        tags = typeof recipe.tags === "string" ? JSON.parse(recipe.tags) : recipe.tags || []
      } catch (e) {
        console.warn(`Failed to parse tags for recipe ${recipe.id}:`, e)
        tags = []
      }

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        author_id: recipe.author_id,
        author_username: recipe.author_username,
        author_email: recipe.author_email,
        category: recipe.category,
        difficulty: recipe.difficulty,
        prep_time_minutes: recipe.prep_time_minutes,
        cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings,
        image_url: recipe.image_url,
        ingredients,
        instructions,
        tags,
        rating: recipe.rating || 0,
        review_count: recipe.review_count || 0,
        view_count: recipe.view_count || 0,
        moderation_status: recipe.moderation_status,
        moderation_notes: recipe.moderation_notes,
        is_published: recipe.is_published,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
      }
    })

    // Log each recipe for debugging
    processedRecipes.forEach((recipe, index) => {
      console.log(`📋 [ADMIN-PENDING] Recipe ${index + 1}:`, {
        id: recipe.id,
        title: recipe.title,
        author: recipe.author_username,
        category: recipe.category,
        difficulty: recipe.difficulty,
        ingredients_count: recipe.ingredients.length,
        instructions_count: recipe.instructions.length,
        created_at: recipe.created_at,
      })
    })

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
      count: processedRecipes.length,
    })
  } catch (error) {
    console.error("❌ [ADMIN-PENDING] Error getting pending recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        recipes: [],
      },
      { status: 500 },
    )
  }
}
