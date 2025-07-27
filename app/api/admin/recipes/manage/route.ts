import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  console.log("📋 [RECIPE-MANAGE-API] Starting recipe management request")

  try {
    // Get auth token from cookies
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.log("❌ [RECIPE-MANAGE-API] No auth token provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify token and get user
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [RECIPE-MANAGE-API] Invalid auth token")
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status 
      FROM users 
      WHERE id = ${payload.userId}
    `

    if (users.length === 0) {
      console.log("❌ [RECIPE-MANAGE-API] User not found")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Check if user has admin/owner permissions
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [RECIPE-MANAGE-API] Insufficient permissions:", user.role)
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get search and filter parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const category = searchParams.get("category") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("🔍 [RECIPE-MANAGE-API] Query parameters:", { search, status, category, limit, offset })

    // Build the query with filters
    const whereConditions = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(
        `(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex + 1} OR u.username ILIKE $${paramIndex + 2})`,
      )
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
      paramIndex += 3
    }

    if (status !== "all") {
      whereConditions.push(`r.moderation_status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (category !== "all") {
      whereConditions.push(`r.category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get recipes with user information
    const recipesQuery = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.category,
        r.difficulty,
        r.prep_time_minutes,
        r.cook_time_minutes,
        r.servings,
        r.image_url,
        r.moderation_status,
        r.is_published,
        r.created_at,
        r.updated_at,
        u.id as author_id,
        u.username as author_username,
        u.email as author_email,
        COALESCE(AVG(rt.rating), 0) as average_rating,
        COUNT(rt.id) as rating_count
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN ratings rt ON r.id = rt.recipe_id
      ${whereClause}
      GROUP BY r.id, u.id, u.username, u.email
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    console.log("🔍 [RECIPE-MANAGE-API] Executing query:", recipesQuery)
    console.log("🔍 [RECIPE-MANAGE-API] Query params:", queryParams)

    const recipes = await sql.unsafe(recipesQuery, queryParams)

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      ${whereClause}
    `

    const countParams = queryParams.slice(0, -2) // Remove limit and offset
    const countResult = await sql.unsafe(countQuery, countParams)
    const totalRecipes = Number.parseInt(countResult[0]?.total || "0")

    console.log("📊 [RECIPE-MANAGE-API] Found recipes:", recipes.length, "Total:", totalRecipes)

    // Get available categories for filtering
    const categories = await sql`
      SELECT DISTINCT category 
      FROM recipes 
      WHERE category IS NOT NULL 
      ORDER BY category
    `

    return NextResponse.json({
      success: true,
      recipes: recipes.map((recipe) => ({
        ...recipe,
        average_rating: Number.parseFloat(recipe.average_rating || "0"),
        rating_count: Number.parseInt(recipe.rating_count || "0"),
      })),
      pagination: {
        total: totalRecipes,
        limit,
        offset,
        hasMore: offset + limit < totalRecipes,
      },
      categories: categories.map((c) => c.category),
    })
  } catch (error) {
    console.error("❌ [RECIPE-MANAGE-API] Error fetching recipes:", error)
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
