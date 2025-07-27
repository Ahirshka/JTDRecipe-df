import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { initializeDatabase } from "@/lib/database-init"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("📋 [MANAGE-RECIPES-API] Starting recipe management request")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [MANAGE-RECIPES-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin/moderator
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [MANAGE-RECIPES-API] User lacks moderation permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [MANAGE-RECIPES-API] Moderation permissions verified for user:", user.username)

    // Initialize database to ensure tables exist
    await initializeDatabase()

    // Import sql after database initialization
    const { sql } = await import("@/lib/neon")

    // Parse query parameters
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "20")
    const status = url.searchParams.get("status") || "all"
    const search = url.searchParams.get("search") || ""
    const author = url.searchParams.get("author") || ""

    const offset = (page - 1) * limit

    console.log("📋 [MANAGE-RECIPES-API] Query parameters:", {
      page,
      limit,
      status,
      search,
      author,
      offset,
    })

    // Build WHERE clause
    const whereConditions = []
    const queryParams: any[] = []

    if (status !== "all") {
      whereConditions.push(`moderation_status = $${queryParams.length + 1}`)
      queryParams.push(status)
    }

    if (search) {
      whereConditions.push(`(title ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 2})`)
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    if (author) {
      whereConditions.push(`author_username ILIKE $${queryParams.length + 1}`)
      queryParams.push(`%${author}%`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM recipes ${whereClause}`
    const totalResult = await sql.unsafe(countQuery, queryParams)
    const total = Number.parseInt(totalResult[0]?.count || "0")

    // Get recipes
    const recipesQuery = `
      SELECT 
        id,
        title,
        description,
        ingredients,
        instructions,
        prep_time,
        cook_time,
        servings,
        difficulty,
        cuisine_type,
        dietary_restrictions,
        author_username,
        moderation_status,
        is_published,
        created_at,
        updated_at
      FROM recipes 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `

    queryParams.push(limit, offset)
    const recipes = await sql.unsafe(recipesQuery, queryParams)

    console.log("✅ [MANAGE-RECIPES-API] Found recipes:", {
      total,
      returned: recipes.length,
      page,
      totalPages: Math.ceil(total / limit),
    })

    return NextResponse.json({
      success: true,
      recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      filters: {
        status,
        search,
        author,
      },
    })
  } catch (error) {
    console.error("❌ [MANAGE-RECIPES-API] Error managing recipes:", error)
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
