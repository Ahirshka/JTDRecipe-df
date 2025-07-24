import { type NextRequest, NextResponse } from "next/server"
import { getAllRecipes, createRecipe, findUserById } from "@/lib/neon"
import { verifyToken } from "@/lib/auth"

export async function GET() {
  try {
    console.log("🔍 Fetching all recipes...")
    const recipes = await getAllRecipes()
    console.log(`✅ Found ${recipes.length} recipes`)

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
    })
  } catch (error) {
    console.error("❌ Error fetching recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
        recipes: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Creating new recipe...")

    // Get auth token from cookie
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      console.log("❌ No auth token found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Verify token and get user
    const payload = await verifyToken(token)
    if (!payload) {
      console.log("❌ Invalid auth token")
      return NextResponse.json({ success: false, error: "Invalid authentication" }, { status: 401 })
    }

    const user = await findUserById(payload.userId)
    if (!user) {
      console.log("❌ User not found")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log(`✅ Authenticated user: ${user.username} (${user.email})`)

    // Parse request body
    const body = await request.json()
    console.log("📝 Recipe data received:", body)

    // Validate required fields
    const requiredFields = ["title", "category", "difficulty", "ingredients", "instructions"]
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`❌ Missing required field: ${field}`)
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Prepare recipe data
    const recipeData = {
      title: body.title,
      description: body.description || "",
      author_id: user.id,
      author_username: user.username,
      category: body.category,
      difficulty: body.difficulty,
      prep_time_minutes: Number(body.prep_time_minutes) || 0,
      cook_time_minutes: Number(body.cook_time_minutes) || 0,
      servings: Number(body.servings) || 1,
      ingredients: body.ingredients,
      instructions: body.instructions,
      image_url: body.image_url || "",
    }

    console.log("🔄 Creating recipe with processed data:", recipeData)

    // Create recipe
    const recipe = await createRecipe(recipeData)

    console.log("✅ Recipe created successfully:", recipe.id)

    return NextResponse.json({
      success: true,
      message: "Recipe submitted for moderation",
      recipe: recipe,
    })
  } catch (error) {
    console.error("❌ Error creating recipe:", error)
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
