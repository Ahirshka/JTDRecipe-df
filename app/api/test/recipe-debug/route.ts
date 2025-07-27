import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUser } from "@/lib/server-auth"
import { addLog } from "./server-logs/route"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    addLog("info", "Recipe debug endpoint accessed")

    const currentUser = await getCurrentUser()

    // Get recipe counts
    const recipesResult = await sql`SELECT COUNT(*) as count FROM recipes`
    const recipeCount = recipesResult[0]?.count || 0

    // Skip pending_recipes table since it doesn't exist
    const pendingCount = 0

    // Get recent recipes
    const recentRecipes = await sql`
      SELECT r.id, r.title, r.created_at, u.username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `

    // Skip pending recipes since table doesn't exist
    const pendingRecipes = []

    const debugInfo = {
      timestamp: new Date().toISOString(),
      currentUser: currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            canAddRecipes: true,
          }
        : null,
      recipeCounts: {
        approved: Number.parseInt(recipeCount),
        pending: pendingCount,
        total: Number.parseInt(recipeCount) + pendingCount,
      },
      recentRecipes: recentRecipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        author: recipe.username,
        createdAt: recipe.created_at,
      })),
      pendingRecipes: pendingRecipes,
      database: {
        tablesExist: {
          recipes: true,
          pendingRecipes: false,
          users: true,
        },
      },
    }

    addLog("info", "Recipe debug completed", debugInfo)

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    addLog("error", "Recipe debug failed", { error: error.message })
    console.error("Recipe debug error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        debug: {
          timestamp: new Date().toISOString(),
          error: "Failed to get recipe debug info",
        },
      },
      { status: 500 },
    )
  }
}
