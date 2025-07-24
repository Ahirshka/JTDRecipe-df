import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = sql`
      SELECT 
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, rating, 
        rating_count, review_count, view_count, created_at, updated_at
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
    `

    if (category) {
      query = sql`
        SELECT 
          id, title, description, author_id, author_username, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, image_url, rating, 
          rating_count, review_count, view_count, created_at, updated_at
        FROM recipes 
        WHERE moderation_status = 'approved' AND is_published = true AND category = ${category}
      `
    }

    if (search) {
      query = sql`
        SELECT 
          id, title, description, author_id, author_username, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, image_url, rating, 
          rating_count, review_count, view_count, created_at, updated_at
        FROM recipes 
        WHERE moderation_status = 'approved' AND is_published = true 
        AND (title ILIKE ${`%${search}%`} OR description ILIKE ${`%${search}%`})
      `
    }

    const recipes = await query

    return NextResponse.json({
      success: true,
      recipes: recipes.slice(offset, offset + limit),
      total: recipes.length,
    })
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      )
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    // Get user info
    const users = await sql`
      SELECT id, username, email, role, status
      FROM users 
      WHERE id = ${decoded.userId} AND status = 'active'
    `

    if (users.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found or inactive",
        },
        { status: 401 },
      )
    }

    const user = users[0]
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
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Create recipe
    const newRecipe = await sql`
      INSERT INTO recipes (
        title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, ingredients, instructions,
        image_url, moderation_status, is_published, created_at, updated_at
      ) VALUES (
        ${title}, ${description || ""}, ${user.id}, ${user.username}, ${category}, ${difficulty},
        ${prep_time_minutes || 0}, ${cook_time_minutes || 0}, ${servings || 1}, 
        ${ingredients}, ${instructions}, ${image_url || ""}, 'pending', false, NOW(), NOW()
      ) RETURNING id, title, moderation_status
    `

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipe: newRecipe[0],
    })
  } catch (error) {
    console.error("Error creating recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create recipe",
      },
      { status: 500 },
    )
  }
}
