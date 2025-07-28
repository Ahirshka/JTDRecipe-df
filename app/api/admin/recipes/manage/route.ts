import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("🔧 [ADMIN-MANAGE-RECIPES] Getting all recipes for management")

  try {
    // Check authentication
    const sessionToken = request.cookies.get("session_token")?.value
    console.log("🔍 [ADMIN-MANAGE-RECIPES] Session token present:", !!sessionToken)

    if (!sessionToken) {
      console.log("❌ [ADMIN-MANAGE-RECIPES] No session token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify session and get user
    const userResult = await sql`
      SELECT u.id, u.username, u.email, u.role, u.status
      FROM users u
      JOIN user_sessions s ON u.id = s.user_id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.status = 'active'
    `

    if (userResult.length === 0) {
      console.log("❌ [ADMIN-MANAGE-RECIPES] Invalid or expired session")
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    const user = userResult[0]
    console.log("✅ [ADMIN-MANAGE-RECIPES] User found:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Check if user has admin privileges
    const adminRoles = ["admin", "owner", "moderator"]
    if (!adminRoles.includes(user.role)) {
      console.log("❌ [ADMIN-MANAGE-RECIPES] User does not have admin privileges:", user.role)
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [ADMIN-MANAGE-RECIPES] Admin access verified")

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const offset = (page - 1) * limit

    console.log("🔍 [ADMIN-MANAGE-RECIPES] Query params:", {
      status,
      page,
      limit,
      search,
      offset,
    })

    // Build WHERE clause
    let whereClause = "WHERE 1=1"
    const queryParams: any[] = []
    let paramIndex = 1

    if (status !== "all") {
      whereClause += ` AND r.status = $${paramIndex}`
      queryParams.push(status)
      paramIndex++
    }

    if (search) {
      whereClause += ` AND (r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      ${whereClause}
    `

    console.log("📊 [ADMIN-MANAGE-RECIPES] Count query:", countQuery)
    console.log("📊 [ADMIN-MANAGE-RECIPES] Count params:", queryParams)

    const countResult = await sql.unsafe(countQuery, queryParams)
    const totalRecipes = Number.parseInt(countResult[0]?.total || "0")

    console.log("📊 [ADMIN-MANAGE-RECIPES] Total recipes found:", totalRecipes)

    // Get recipes with pagination
    const recipesQuery = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.ingredients,
        r.instructions,
        r.prep_time,
        r.cook_time,
        r.servings,
        r.difficulty,
        r.tags,
        r.image_url,
        r.status,
        r.created_at,
        r.updated_at,
        u.username as author_name,
        u.email as author_email,
        u.id as author_id
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    queryParams.push(limit, offset)

    console.log("📋 [ADMIN-MANAGE-RECIPES] Recipes query:", recipesQuery)
    console.log("📋 [ADMIN-MANAGE-RECIPES] Recipes params:", queryParams)

    const recipesResult = await sql.unsafe(recipesQuery, queryParams)

    console.log("📋 [ADMIN-MANAGE-RECIPES] Raw recipes found:", recipesResult.length)

    // Format recipes
    const formattedRecipes = recipesResult.map((recipe: any) => {
      // Parse JSON fields safely
      let ingredients = []
      let instructions = []
      let tags = []

      try {
        ingredients = typeof recipe.ingredients === "string" ? JSON.parse(recipe.ingredients) : recipe.ingredients || []
      } catch (e) {
        console.log("⚠️ [ADMIN-MANAGE-RECIPES] Failed to parse ingredients for recipe:", recipe.id)
        ingredients = []
      }

      try {
        instructions =
          typeof recipe.instructions === "string" ? JSON.parse(recipe.instructions) : recipe.instructions || []
      } catch (e) {
        console.log("⚠️ [ADMIN-MANAGE-RECIPES] Failed to parse instructions for recipe:", recipe.id)
        instructions = []
      }

      try {
        tags = typeof recipe.tags === "string" ? JSON.parse(recipe.tags) : recipe.tags || []
      } catch (e) {
        console.log("⚠️ [ADMIN-MANAGE-RECIPES] Failed to parse tags for recipe:", recipe.id)
        tags = []
      }

      return {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        ingredients,
        instructions,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        tags,
        imageUrl: recipe.image_url,
        status: recipe.status,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        author: {
          id: recipe.author_id,
          name: recipe.author_name,
          email: recipe.author_email,
        },
      }
    })

    console.log("✅ [ADMIN-MANAGE-RECIPES] Formatted recipes:", formattedRecipes.length)

    // Calculate pagination info
    const totalPages = Math.ceil(totalRecipes / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    const response = {
      success: true,
      recipes: formattedRecipes,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecipes,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      filters: {
        status,
        search,
      },
      message: "Recipes retrieved successfully",
    }

    console.log("✅ [ADMIN-MANAGE-RECIPES] Response prepared:", {
      recipesCount: formattedRecipes.length,
      totalRecipes,
      currentPage: page,
      totalPages,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("❌ [ADMIN-MANAGE-RECIPES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
