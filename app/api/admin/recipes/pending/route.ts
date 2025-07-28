import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("📋 [PENDING-RECIPES] Starting pending recipes request")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [PENDING-RECIPES] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [PENDING-RECIPES] No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session and get user
    console.log("🔍 [PENDING-RECIPES] Verifying session...")
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [PENDING-RECIPES] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [PENDING-RECIPES] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [PENDING-RECIPES] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [PENDING-RECIPES] Admin access verified")

    // Get pending recipes
    console.log("📋 [PENDING-RECIPES] Fetching pending recipes...")
    const pendingRecipes = await sql`
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
        created_at,
        updated_at
      FROM recipes
      WHERE moderation_status = 'pending'
      ORDER BY created_at ASC
    `

    console.log(`✅ [PENDING-RECIPES] Found ${pendingRecipes.length} pending recipes`)

    // Process recipes to ensure proper data format
    const processedRecipes = pendingRecipes.map((recipe) => {
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
        console.warn("Failed to parse ingredients for recipe:", recipe.id, error)
        ingredients = [recipe.ingredients || "No ingredients specified"]
      }

      // Parse instructions
      try {
        if (typeof recipe.instructions === "string") {
          instructions = JSON.parse(recipe.instructions)
        } else if (Array.isArray(recipe.instructions)) {
          instructions = recipe.instructions
        }
      } catch (error) {
        console.warn("Failed to parse instructions for recipe:", recipe.id, error)
        instructions = [recipe.instructions || "No instructions specified"]
      }

      // Parse tags
      try {
        if (typeof recipe.tags === "string") {
          tags = JSON.parse(recipe.tags)
        } else if (Array.isArray(recipe.tags)) {
          tags = recipe.tags
        }
      } catch (error) {
        console.warn("Failed to parse tags for recipe:", recipe.id, error)
        tags = []
      }

      return {
        ...recipe,
        ingredients,
        instructions,
        tags,
      }
    })

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
      count: processedRecipes.length,
      message: `Found ${processedRecipes.length} pending recipes`,
    })
  } catch (error) {
    console.error("❌ [PENDING-RECIPES] Error:", error)
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
