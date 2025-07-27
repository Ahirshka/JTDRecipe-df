import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

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

    // Check if user is admin/owner
    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [ADMIN-PENDING] User lacks admin permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-PENDING] Admin permissions verified for user:", user.username)

    // Fetch pending recipes
    const recipes = await sql`
      SELECT 
        id,
        title,
        description,
        author_id,
        author_username,
        category,
        difficulty,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        image_url,
        ingredients,
        instructions,
        tags,
        moderation_status,
        is_published,
        created_at,
        updated_at
      FROM recipes 
      WHERE moderation_status = 'pending' OR moderation_status IS NULL
      ORDER BY created_at ASC
    `

    console.log(`📋 [ADMIN-PENDING] Found ${recipes.length} pending recipes`)

    // Process recipes to ensure proper data format
    const processedRecipes = recipes.map((recipe) => {
      let ingredients = []
      let instructions = []

      // Process ingredients
      try {
        if (recipe.ingredients) {
          if (typeof recipe.ingredients === "string") {
            try {
              ingredients = JSON.parse(recipe.ingredients)
            } catch {
              ingredients = [recipe.ingredients]
            }
          } else if (Array.isArray(recipe.ingredients)) {
            ingredients = recipe.ingredients
          } else {
            ingredients = [String(recipe.ingredients)]
          }
        }
      } catch (error) {
        console.log("⚠️ [ADMIN-PENDING] Error processing ingredients for recipe", recipe.id, error)
        ingredients = []
      }

      // Process instructions
      try {
        if (recipe.instructions) {
          if (typeof recipe.instructions === "string") {
            try {
              instructions = JSON.parse(recipe.instructions)
            } catch {
              instructions = [recipe.instructions]
            }
          } else if (Array.isArray(recipe.instructions)) {
            instructions = recipe.instructions
          } else {
            instructions = [String(recipe.instructions)]
          }
        }
      } catch (error) {
        console.log("⚠️ [ADMIN-PENDING] Error processing instructions for recipe", recipe.id, error)
        instructions = []
      }

      return {
        id: recipe.id,
        title: recipe.title || "Untitled Recipe",
        description: recipe.description || "",
        author_id: recipe.author_id,
        author_username: recipe.author_username || "Unknown",
        category: recipe.category || "Other",
        difficulty: recipe.difficulty || "Easy",
        prep_time_minutes: recipe.prep_time_minutes || 0,
        cook_time_minutes: recipe.cook_time_minutes || 0,
        servings: recipe.servings || 1,
        image_url: recipe.image_url || "",
        ingredients,
        instructions,
        tags: recipe.tags || [],
        moderation_status: recipe.moderation_status || "pending",
        is_published: recipe.is_published || false,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
      }
    })

    console.log("✅ [ADMIN-PENDING] Processed pending recipes successfully")

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
        error: "Failed to fetch pending recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
