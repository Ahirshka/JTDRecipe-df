import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("🔧 [MANAGE-RECIPES] Starting manage recipes request")

  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [MANAGE-RECIPES] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [MANAGE-RECIPES] No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session and get user
    console.log("🔍 [MANAGE-RECIPES] Verifying session...")
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [MANAGE-RECIPES] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [MANAGE-RECIPES] User authenticated:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [MANAGE-RECIPES] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [MANAGE-RECIPES] Admin access verified")

    // Get URL parameters for filtering and pagination
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const author = searchParams.get("author") || ""

    console.log("🔍 [MANAGE-RECIPES] Query parameters:", {
      page,
      limit,
      status,
      search,
      category,
      author,
    })

    // Build WHERE clause based on filters
    const whereConditions = []
    const queryParams = []

    if (status !== "all") {
      whereConditions.push(`moderation_status = $${queryParams.length + 1}`)
      queryParams.push(status)
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 2})`)
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (category) {
      whereConditions.push(`category = $${queryParams.length + 1}`)
      queryParams.push(category)
    }

    if (author) {
      whereConditions.push(`author_username ILIKE $${queryParams.length + 1}`)
      queryParams.push(`%${author}%`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    console.log("📋 [MANAGE-RECIPES] Fetching recipes with filters...")

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM recipes ${whereClause}`
    const countResult = await sql.unsafe(countQuery, queryParams)
    const totalRecipes = Number.parseInt(countResult[0]?.total || "0")

    // Get recipes with pagination
    const recipesQuery = `
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
        rating,
        review_count,
        view_count,
        moderation_status,
        moderation_notes,
        is_published,
        created_at,
        updated_at
      FROM recipes
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `

    const recipes = await sql.unsafe(recipesQuery, [...queryParams, limit, offset])

    console.log(`✅ [MANAGE-RECIPES] Found ${recipes.length} recipes (${totalRecipes} total)`)

    // Process recipes to ensure proper data format
    const processedRecipes = recipes.map((recipe) => {
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

    // Calculate pagination info
    const totalPages = Math.ceil(totalRecipes / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecipes,
        limit,
        hasNextPage,
        hasPrevPage,
      },
      filters: {
        status,
        search,
        category,
        author,
      },
      message: `Found ${processedRecipes.length} recipes`,
    })
  } catch (error) {
    console.error("❌ [MANAGE-RECIPES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
