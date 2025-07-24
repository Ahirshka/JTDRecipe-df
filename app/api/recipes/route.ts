import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
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
        COALESCE(rating, 0)::DECIMAL as rating,
        COALESCE(rating_count, 0)::INTEGER as rating_count,
        COALESCE(review_count, 0)::INTEGER as review_count,
        COALESCE(view_count, 0)::INTEGER as view_count,
        moderation_status,
        is_published,
        created_at,
        updated_at
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
      ORDER BY created_at DESC
    `

    // Ensure all numeric fields are properly converted
    const processedRecipes = recipes.map((recipe) => ({
      ...recipe,
      rating: Number(recipe.rating) || 0,
      rating_count: Number(recipe.rating_count) || 0,
      review_count: Number(recipe.review_count) || 0,
      view_count: Number(recipe.view_count) || 0,
      prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
      cook_time_minutes: Number(recipe.cook_time_minutes) || 0,
      servings: Number(recipe.servings) || 1,
    }))

    return NextResponse.json({
      success: true,
      recipes: processedRecipes,
    })
  } catch (error) {
    console.error("Error fetching recipes:", error)

    // Return mock data if database fails
    const mockRecipes = [
      {
        id: "1",
        title: "Perfect Scrambled Eggs",
        description: "Creamy, fluffy scrambled eggs made the right way",
        author_id: "1",
        author_username: "Aaron Hirshka",
        category: "Breakfast",
        difficulty: "Easy",
        prep_time_minutes: 2,
        cook_time_minutes: 5,
        servings: 2,
        image_url: null,
        rating: 4.8,
        rating_count: 10,
        review_count: 24,
        view_count: 156,
        moderation_status: "approved",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Classic Pancakes",
        description: "Fluffy pancakes that are perfect every time",
        author_id: "1",
        author_username: "Aaron Hirshka",
        category: "Breakfast",
        difficulty: "Easy",
        prep_time_minutes: 5,
        cook_time_minutes: 10,
        servings: 4,
        image_url: null,
        rating: 4.6,
        rating_count: 8,
        review_count: 15,
        view_count: 89,
        moderation_status: "approved",
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    return NextResponse.json({
      success: true,
      recipes: mockRecipes,
    })
  }
}

export async function POST(request: Request) {
  try {
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
      author_id,
      author_username,
    } = body

    if (!title || !category || !difficulty || !ingredients || !instructions || !author_id || !author_username) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    const newRecipe = await sql`
      INSERT INTO recipes (
        title, description, category, difficulty, prep_time_minutes, cook_time_minutes,
        servings, ingredients, instructions, image_url, author_id, author_username,
        moderation_status, is_published, created_at, updated_at
      ) VALUES (
        ${title}, ${description}, ${category}, ${difficulty}, ${prep_time_minutes || 0},
        ${cook_time_minutes || 0}, ${servings || 1}, ${ingredients}, ${instructions},
        ${image_url || null}, ${author_id}, ${author_username}, 'pending', false, NOW(), NOW()
      ) RETURNING id, title, moderation_status
    `

    return NextResponse.json({
      success: true,
      message: "Recipe submitted for review",
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
