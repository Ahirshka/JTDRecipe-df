import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyToken } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  console.log("📋 [MANAGE-RECIPES-API] Starting recipe management request")

  try {
    // Get auth token from cookies
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.log("❌ [MANAGE-RECIPES-API] No auth token provided")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify token and get user
    const payload = verifyToken(token)
    if (!payload) {
      console.log("❌ [MANAGE-RECIPES-API] Invalid auth token")
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status 
      FROM users 
      WHERE id = ${payload.userId}
    `

    if (users.length === 0) {
      console.log("❌ [MANAGE-RECIPES-API] User not found")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = users[0]

    // Check if user has admin/owner permissions
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [MANAGE-RECIPES-API] Insufficient permissions:", user.role)
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    console.log("🔍 [MANAGE-RECIPES-API] Query params:", { status, search, limit, offset })

    // Build the query based on filters
    let whereClause = "WHERE 1=1"
    const queryParams: any[] = []

    if (status !== "all") {
      whereClause += ` AND moderation_status = $${queryParams.length + 1}`
      queryParams.push(status)
    }

    if (search) {
      whereClause += ` AND (title ILIKE $${queryParams.length + 1} OR author_username ILIKE $${queryParams.length + 2})`
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    // Get recipes with pagination
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
        moderation_status,
        is_published,
        rating,
        review_count,
        view_count,
        created_at,
        updated_at,
        approved_at
      FROM recipes 
      ${sql.unsafe(whereClause)}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM recipes 
      ${sql.unsafe(whereClause)}
    `

    const totalRecipes = Number.parseInt(countResult[0].total)

    console.log(`✅ [MANAGE-RECIPES-API] Found ${recipes.length} recipes (${totalRecipes} total)`)

    return NextResponse.json({
      success: true,
      recipes,
      pagination: {
        total: totalRecipes,
        limit,
        offset,
        hasMore: offset + limit < totalRecipes,
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
