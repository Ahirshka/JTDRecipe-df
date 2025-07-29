import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest, isAdmin } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("📋 [ADMIN-RECIPE-MANAGE] Getting recipes for management")

  try {
    // Get current user and verify authentication
    console.log("🔍 [ADMIN-RECIPE-MANAGE] Verifying user authentication...")
    const currentUser = await getCurrentUserFromRequest(request)

    if (!currentUser) {
      console.log("❌ [ADMIN-RECIPE-MANAGE] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [ADMIN-RECIPE-MANAGE] User authenticated:", {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
    })

    // Check if user has admin privileges
    if (!isAdmin(currentUser)) {
      console.log("❌ [ADMIN-RECIPE-MANAGE] User does not have admin privileges:", {
        username: currentUser.username,
        role: currentUser.role,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
          details: `Your role '${currentUser.role}' does not have admin privileges.`,
        },
        { status: 403 },
      )
    }

    console.log("✅ [ADMIN-RECIPE-MANAGE] Admin access verified for:", currentUser.username)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status") || ""
    const search = searchParams.get("search") || ""

    const offset = (page - 1) * limit

    console.log("📋 [ADMIN-RECIPE-MANAGE] Query parameters:", {
      page,
      limit,
      status,
      search,
      offset,
    })

    // Build WHERE clause
    const whereConditions = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex += 1
    }

    if (search) {
      whereConditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex + 1})`)
      queryParams.push(`%${search}%`, `%${search}%`)
      paramIndex += 2
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM recipes r
      ${whereClause}
    `

    console.log("🔢 [ADMIN-RECIPE-MANAGE] Executing count query:", countQuery)
    const countResult = await sql.unsafe(countQuery, queryParams)
    const totalRecipes = Number.parseInt(countResult[0]?.total || "0")

    // Get recipes with author information
    const recipesQuery = `
      SELECT 
        r.id, r.title, r.description, r.prep_time, r.cook_time, 
        r.servings, r.difficulty, r.tags, r.status, r.moderation_status,
        r.created_at, r.updated_at,
        u.username as author_name, u.email as author_email
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    console.log("📋 [ADMIN-RECIPE-MANAGE] Executing recipes query:", recipesQuery)
    const recipes = await sql.unsafe(recipesQuery, [...queryParams, limit, offset])

    console.log("✅ [ADMIN-RECIPE-MANAGE] Recipes retrieved:", {
      totalRecipes,
      returnedRecipes: recipes.length,
      page,
      limit,
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalRecipes / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      recipes: recipes.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        status: recipe.status,
        moderationStatus: recipe.moderation_status,
        createdAt: recipe.created_at,
        updatedAt: recipe.updated_at,
        author: {
          name: recipe.author_name,
          email: recipe.author_email,
        },
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalRecipes,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      currentUser: {
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
      },
      message: "Recipes retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-RECIPE-MANAGE] Error:", error)
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

export async function POST(request: NextRequest) {
  console.log("📝 [ADMIN-RECIPE-MANAGE] Managing recipe")

  try {
    // Get current user and verify authentication
    const currentUser = await getCurrentUserFromRequest(request)

    if (!currentUser) {
      console.log("❌ [ADMIN-RECIPE-MANAGE] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!isAdmin(currentUser)) {
      console.log("❌ [ADMIN-RECIPE-MANAGE] User does not have admin privileges")
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { action, recipeId, updates } = body

    console.log("📝 [ADMIN-RECIPE-MANAGE] Recipe management action:", {
      action,
      recipeId,
      updates,
      adminUser: currentUser.username,
    })

    if (action === "update" && recipeId && updates) {
      // Update recipe
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(updates)) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(value)
        paramIndex += 1
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)

      const updateQuery = `
        UPDATE recipes 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex}
        RETURNING id, title, status, moderation_status
      `

      const result = await sql.unsafe(updateQuery, [...updateValues, recipeId])

      if (result.length === 0) {
        return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
      }

      console.log("✅ [ADMIN-RECIPE-MANAGE] Recipe updated successfully:", result[0])

      return NextResponse.json({
        success: true,
        recipe: result[0],
        message: "Recipe updated successfully",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action or missing parameters" }, { status: 400 })
  } catch (error) {
    console.error("❌ [ADMIN-RECIPE-MANAGE] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to manage recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
