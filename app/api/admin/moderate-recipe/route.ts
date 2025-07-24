import { type NextRequest, NextResponse } from "next/server"
import { moderateRecipe, getPendingRecipes } from "@/lib/neon"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: string }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { recipeId, action } = body

    if (!recipeId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Moderate the recipe
    const moderatedRecipe = await moderateRecipe(recipeId, action, userId)

    if (!moderatedRecipe) {
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Recipe ${action}d successfully`,
      recipe: moderatedRecipe,
    })
  } catch (error) {
    console.error("Recipe moderation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const pendingRecipes = await getPendingRecipes()

    return NextResponse.json({
      success: true,
      recipes: pendingRecipes,
      count: pendingRecipes.length,
    })
  } catch (error) {
    console.error("Get pending recipes error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
