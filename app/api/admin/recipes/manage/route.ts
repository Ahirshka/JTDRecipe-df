import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  console.log("📋 [MANAGE-RECIPES-API] Starting recipe management request")

  try {
    // Get current user using server-auth
    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      console.log("❌ [MANAGE-RECIPES-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [MANAGE-RECIPES-API] Found authenticated user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin/owner/moderator permissions
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [MANAGE-RECIPES-API] Insufficient permissions:", user.role)
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    console.log("🔍 [MANAGE-RECIPES-API] Query parameters:", { search, status, category, page, limit })

    // Build the WHERE clause
    const whereConditions = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1} OR author_username ILIKE $${paramIndex + 2})`,
      )
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
      paramIndex += 3
    }

    if (status) {
      whereConditions.push(`moderation_status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    if (category) {
      whereConditions.push(`category = $${paramIndex}`)
      queryParams.push(category)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recipes
      ${whereClause}
    `

    console.log("📊 [MANAGE-RECIPES-API] Count query:", countQuery)
    console.log("📊 [MANAGE-RECIPES-API] Query params:", queryParams)

    const countResult = await sql.unsafe(countQuery, queryParams)
    const totalRecipes = Number.parseInt(countResult[0]?.total || "0")

    // Get recipes
    const recipesQuery = `
      SELECT 
        id,
        title,
        description,
        category,
        difficulty,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        image_url,
        moderation_status,
        is_published,
        created_at,
        updated_at,
        author_id,
        author_username,
        average_rating,
        rating_count,
        view_count
      FROM recipes
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    console.log("📋 [MANAGE-RECIPES-API] Recipes query:", recipesQuery)
    console.log("📋 [MANAGE-RECIPES-API] Final query params:", queryParams)

    const recipes = await sql.unsafe(recipesQuery, queryParams)

    console.log("✅ [MANAGE-RECIPES-API] Found recipes:", recipes.length)

    // Get recipe statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN moderation_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN moderation_status = 'rejected' THEN 1 END) as rejected
      FROM recipes
    `

    const statsResult = await sql.unsafe(statsQuery)
    const stats = statsResult[0] || { total: 0, approved: 0, pending: 0, rejected: 0 }

    console.log("📊 [MANAGE-RECIPES-API] Recipe stats:", stats)

    return NextResponse.json({
      success: true,
      recipes: recipes.map((recipe) => ({
        ...recipe,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        tags: recipe.tags || [],
        average_rating: Number.parseFloat(recipe.average_rating || "0"),
        rating_count: Number.parseInt(recipe.rating_count || "0"),
        view_count: Number.parseInt(recipe.view_count || "0"),
      })),
      pagination: {
        page,
        limit,
        total: totalRecipes,
        totalPages: Math.ceil(totalRecipes / limit),
      },
      stats: {
        total: Number.parseInt(stats.total || "0"),
        approved: Number.parseInt(stats.approved || "0"),
        pending: Number.parseInt(stats.pending || "0"),
        rejected: Number.parseInt(stats.rejected || "0"),
      },
    })
  } catch (error) {
    console.error("❌ [MANAGE-RECIPES-API] Error fetching recipes:", error)
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
