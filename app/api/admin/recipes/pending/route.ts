import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest, isModerator } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("⏳ [ADMIN-PENDING-RECIPES] Getting pending recipes")

  try {
    // Get current user and verify authentication
    console.log("🔍 [ADMIN-PENDING-RECIPES] Verifying user authentication...")
    const currentUser = await getCurrentUserFromRequest(request)

    if (!currentUser) {
      console.log("❌ [ADMIN-PENDING-RECIPES] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [ADMIN-PENDING-RECIPES] User authenticated:", {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
    })

    // Check if user has moderator privileges (includes admin and owner)
    if (!isModerator(currentUser)) {
      console.log("❌ [ADMIN-PENDING-RECIPES] User does not have moderator privileges:", {
        username: currentUser.username,
        role: currentUser.role,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Moderator access required",
          details: `Your role '${currentUser.role}' does not have moderation privileges.`,
        },
        { status: 403 },
      )
    }

    console.log("✅ [ADMIN-PENDING-RECIPES] Moderator access verified for:", currentUser.username)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const offset = (page - 1) * limit

    console.log("📋 [ADMIN-PENDING-RECIPES] Query parameters:", {
      page,
      limit,
      offset,
    })

    // Get total count of pending recipes
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM recipes
      WHERE status = 'pending' OR moderation_status = 'pending'
    `

    const totalPendingRecipes = Number.parseInt(countResult[0]?.total || "0")

    // Get pending recipes with author information
    const pendingRecipes = await sql`
      SELECT 
        r.id, r.title, r.description, r.ingredients, r.instructions,
        r.prep_time, r.cook_time, r.servings, r.difficulty, r.tags,
        r.image_url, r.status, r.moderation_status, r.created_at,
        u.username as author_name, u.email as author_email, u.id as author_id
      FROM recipes r
      LEFT JOIN users u ON r.author_id = u.id
      WHERE r.status = 'pending' OR r.moderation_status = 'pending'
      ORDER BY r.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    console.log("✅ [ADMIN-PENDING-RECIPES] Pending recipes retrieved:", {
      totalPendingRecipes,
      returnedRecipes: pendingRecipes.length,
      page,
      limit,
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalPendingRecipes / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      recipes: pendingRecipes.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prepTime: recipe.prep_time,
        cookTime: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        imageUrl: recipe.image_url,
        status: recipe.status,
        moderationStatus: recipe.moderation_status,
        createdAt: recipe.created_at,
        author: {
          id: recipe.author_id,
          name: recipe.author_name,
          email: recipe.author_email,
        },
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalRecipes: totalPendingRecipes,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      currentUser: {
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
      },
      message: "Pending recipes retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-PENDING-RECIPES] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get pending recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
