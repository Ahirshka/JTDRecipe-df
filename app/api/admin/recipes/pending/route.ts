import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-PENDING] Fetching pending recipes")

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

    // Fetch pending recipes
    const pendingRecipes = await sql`
      SELECT 
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, ingredients, 
        instructions, tags, moderation_status, created_at, updated_at
      FROM recipes 
      WHERE moderation_status = 'pending'
      ORDER BY created_at DESC
    `

    console.log(`📋 [ADMIN-PENDING] Found ${pendingRecipes.length} pending recipes`)

    // Process recipes to ensure proper data format
    const processedRecipes = pendingRecipes.map((recipe: any) => {
      let ingredients = []
      let instructions = []
      let tags = []

      // Parse ingredients
      try {
        if (typeof recipe.ingredients === "string") {
          ingredients = JSON.parse(recipe.ingredients)
        } else if (Array.isArray(recipe.ingredients)) {
          ingredients = recipe.ingredients
        }
      } catch (error) {
        console.warn(`Failed to parse ingredients for recipe ${recipe.id}:`, error)
        ingredients = []
      }

      // Parse instructions
      try {
        if (typeof recipe.instructions === "string") {
          instructions = JSON.parse(recipe.instructions)
        } else if (Array.isArray(recipe.instructions)) {
          instructions = recipe.instructions
        }
      } catch (error) {
        console.warn(`Failed to parse instructions for recipe ${recipe.id}:`, error)
        instructions = []
      }

      // Parse tags
      try {
        if (typeof recipe.tags === "string") {
          tags = JSON.parse(recipe.tags)
        } else if (Array.isArray(recipe.tags)) {
          tags = recipe.tags
        }
      } catch (error) {
        console.warn(`Failed to parse tags for recipe ${recipe.id}:`, error)
        tags = []
      }

      return {
        ...recipe,
        ingredients,
        instructions,
        tags,
        prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
        cook_time_minutes: Number(recipe.cook_time_minutes) || 0,
        servings: Number(recipe.servings) || 1,
      }
    })

    console.log("✅ [ADMIN-PENDING] Recipes processed successfully")

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
      count: processedRecipes.length,
    })
  } catch (error) {
    console.error("❌ [ADMIN-PENDING] Error fetching pending recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        recipes: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
