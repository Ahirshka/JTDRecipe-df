import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const recipes = await sql`
      SELECT 
        r.*,
        u.username as author_username,
        COALESCE(r.rating, 0) as rating,
        COALESCE(r.review_count, 0) as review_count,
        COALESCE(r.view_count, 0) as view_count
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'approved' 
        AND r.is_published = true
      ORDER BY r.created_at DESC
      LIMIT 50
    `

    const formattedRecipes = recipes.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      author_username: row.author_username,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: Number.parseFloat(row.rating) || 0,
      review_count: Number.parseInt(row.review_count) || 0,
      view_count: Number.parseInt(row.view_count) || 0,
      moderation_status: row.moderation_status,
      is_published: row.is_published,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return NextResponse.json({
      success: true,
      recipes: formattedRecipes,
      count: formattedRecipes.length,
    })
  } catch (error) {
    console.error("Failed to get recipes:", error)
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
  try {
    await initializeDatabase()

    // Get user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let userId: number
    let username: string
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      userId = decoded.userId

      // Get username from database
      const user = await sql`SELECT username FROM users WHERE id = ${userId}`
      if (!user.length) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      username = user[0].username
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const recipeData = await request.json()

    // Validate required fields
    if (!recipeData.title || !recipeData.category || !recipeData.difficulty) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, category, difficulty" },
        { status: 400 },
      )
    }

    // Validate ingredients and instructions
    if (!recipeData.ingredients || !Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      return NextResponse.json({ success: false, error: "At least one ingredient is required" }, { status: 400 })
    }

    if (!recipeData.instructions || !Array.isArray(recipeData.instructions) || recipeData.instructions.length === 0) {
      return NextResponse.json({ success: false, error: "At least one instruction is required" }, { status: 400 })
    }

    // Convert arrays to text for storage
    const ingredientsText = recipeData.ingredients
      .map((ing: any) => `${ing.amount || ""} ${ing.unit || ""} ${ing.ingredient || ""}`.trim())
      .filter((ing: string) => ing.length > 0)
      .join("\n")

    const instructionsText = recipeData.instructions
      .map((inst: any, index: number) => `${index + 1}. ${inst.instruction || inst}`)
      .filter((inst: string) => inst.length > 3)
      .join("\n")

    if (!ingredientsText || !instructionsText) {
      return NextResponse.json(
        { success: false, error: "Valid ingredients and instructions are required" },
        { status: 400 },
      )
    }

    // Insert recipe
    const result = await sql`
      INSERT INTO recipes (
        title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url,
        ingredients, instructions, moderation_status, is_published, created_at, updated_at
      ) VALUES (
        ${recipeData.title}, 
        ${recipeData.description || null}, 
        ${userId},
        ${username},
        ${recipeData.category}, 
        ${recipeData.difficulty}, 
        ${recipeData.prep_time_minutes || 0},
        ${recipeData.cook_time_minutes || 0}, 
        ${recipeData.servings || 1}, 
        ${recipeData.image_url || null},
        ${ingredientsText},
        ${instructionsText},
        'pending', 
        false, 
        NOW(), 
        NOW()
      )
      RETURNING id
    `

    const recipeId = result[0].id

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully! It will be reviewed by our moderators before being published.",
      recipeId: recipeId,
    })
  } catch (error) {
    console.error("Failed to create recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
