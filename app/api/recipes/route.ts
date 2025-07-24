import { type NextRequest, NextResponse } from "next/server"
import { sql, createRecipe, getAllRecipes } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET() {
  try {
    const recipes = await getAllRecipes()
    return NextResponse.json({ success: true, recipes })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch recipes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      difficulty,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      ingredients,
      instructions,
      image_url,
    } = body

    // Validate required fields
    if (!title || !category || !difficulty || !ingredients || !instructions) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get user info
    const userResult = await sql`
      SELECT id, username FROM users WHERE id = ${decoded.userId}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user = userResult[0]

    const recipeData = {
      title,
      description: description || "",
      author_id: user.id,
      author_username: user.username,
      category,
      difficulty,
      prep_time_minutes: Number.parseInt(prep_time_minutes) || 0,
      cook_time_minutes: Number.parseInt(cook_time_minutes) || 0,
      servings: Number.parseInt(servings) || 1,
      ingredients,
      instructions,
      image_url: image_url || null,
    }

    const recipe = await createRecipe(recipeData)

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipe,
    })
  } catch (error) {
    console.error("Error creating recipe:", error)
    return NextResponse.json({ success: false, error: "Failed to create recipe" }, { status: 500 })
  }
}
