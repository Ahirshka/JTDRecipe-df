import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// GET - Fetch published recipes
export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES-API] Starting recipe fetch")

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""

    console.log("📋 [RECIPES-API] Query parameters:", { limit, search, category })

    // Test database connection first
    try {
      await sql`SELECT 1`
      console.log("✅ [RECIPES-API] Database connection successful")
    } catch (dbError) {
      console.error("❌ [RECIPES-API] Database connection failed:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
          recipes: [],
          count: 0,
        },
        { status: 500 },
      )
    }

    // First, let's check what recipes exist in the database
    const allRecipesCheck = await sql`
      SELECT 
        id, title, moderation_status, is_published, created_at, updated_at
      FROM recipes 
      ORDER BY created_at DESC
      LIMIT 10
    `
    console.log("🔍 [RECIPES-API] Sample recipes in database:", allRecipesCheck)

    // Check specifically for approved and published recipes
    const approvedCheck = await sql`
      SELECT COUNT(*) as count
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
    `
    console.log("📊 [RECIPES-API] Approved & published recipe count:", approvedCheck[0]?.count || 0)

    // Build the main query - get approved and published recipes
    let baseQuery = `
      SELECT 
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, 
        rating, review_count, view_count, moderation_status, is_published,
        created_at, updated_at
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
    `

    const queryParams: any[] = []
    let paramIndex = 1

    if (search && search.trim()) {
      baseQuery += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      queryParams.push(`%${search.trim()}%`)
      paramIndex++
    }

    if (category && category.trim() && category !== "all-categories") {
      baseQuery += ` AND category = $${paramIndex}`
      queryParams.push(category.trim())
      paramIndex++
    }

    baseQuery += ` ORDER BY updated_at DESC, created_at DESC LIMIT $${paramIndex}`
    queryParams.push(limit)

    console.log("🔍 [RECIPES-API] Executing query:", baseQuery)
    console.log("📋 [RECIPES-API] Query params:", queryParams)

    // Execute the query
    let recipes
    try {
      if (queryParams.length === 1) {
        // Only limit parameter
        recipes = await sql`
          SELECT 
            id, title, description, author_id, author_username, category, difficulty,
            prep_time_minutes, cook_time_minutes, servings, image_url, 
            rating, review_count, view_count, moderation_status, is_published,
            created_at, updated_at
          FROM recipes 
          WHERE moderation_status = 'approved' AND is_published = true
          ORDER BY updated_at DESC, created_at DESC 
          LIMIT ${limit}
        `
      } else {
        // Use parameterized query for search/category filters
        recipes = await sql.unsafe(baseQuery, queryParams)
      }

      console.log(`✅ [RECIPES-API] Query executed successfully, found ${recipes.length} recipes`)

      // Log first few recipes for debugging
      if (recipes.length > 0) {
        console.log(
          "📋 [RECIPES-API] Sample retrieved recipes:",
          recipes.slice(0, 3).map((r) => ({
            id: r.id,
            title: r.title,
            status: r.moderation_status,
            published: r.is_published,
            author: r.author_username,
          })),
        )
      }
    } catch (queryError) {
      console.error("❌ [RECIPES-API] Query execution failed:", queryError)
      return NextResponse.json(
        {
          success: false,
          error: "Query execution failed",
          details: queryError instanceof Error ? queryError.message : "Unknown query error",
          recipes: [],
          count: 0,
        },
        { status: 500 },
      )
    }

    // Process recipes and calculate approval timing
    const processedRecipes = recipes.map((recipe: any) => {
      try {
        const createdDate = new Date(recipe.created_at)
        const updatedDate = new Date(recipe.updated_at)

        // If updated_at is significantly later than created_at, it's likely the approval time
        const approvalDate = updatedDate > createdDate ? updatedDate : createdDate
        const daysSinceApproval = Math.floor((Date.now() - approvalDate.getTime()) / (1000 * 60 * 60 * 24))
        const isRecentlyApproved = daysSinceApproval <= 30

        return {
          id: recipe.id || "",
          title: recipe.title || "Untitled Recipe",
          description: recipe.description || "",
          author_id: recipe.author_id || "",
          author_username: recipe.author_username || "Unknown Author",
          category: recipe.category || "Other",
          difficulty: recipe.difficulty || "Medium",
          prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
          cook_time_minutes: Number(recipe.cook_time_minutes) || 0,
          servings: Number(recipe.servings) || 1,
          image_url: recipe.image_url || "/placeholder.svg?height=200&width=300",
          rating: Number(recipe.rating) || 0,
          review_count: Number(recipe.review_count) || 0,
          view_count: Number(recipe.view_count) || 0,
          moderation_status: recipe.moderation_status || "pending",
          is_published: Boolean(recipe.is_published),
          created_at: recipe.created_at || new Date().toISOString(),
          updated_at: recipe.updated_at || new Date().toISOString(),
          approval_date: approvalDate.toISOString(),
          days_since_approval: daysSinceApproval,
          is_recently_approved: isRecentlyApproved,
        }
      } catch (processingError) {
        console.error("❌ [RECIPES-API] Error processing recipe:", processingError)
        // Return a safe default recipe object
        return {
          id: recipe.id || `error_${Date.now()}`,
          title: recipe.title || "Error Loading Recipe",
          description: "There was an error loading this recipe",
          author_id: recipe.author_id || "",
          author_username: recipe.author_username || "Unknown",
          category: "Other",
          difficulty: "Medium",
          prep_time_minutes: 0,
          cook_time_minutes: 0,
          servings: 1,
          image_url: "/placeholder.svg?height=200&width=300",
          rating: 0,
          review_count: 0,
          view_count: 0,
          moderation_status: "approved",
          is_published: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          approval_date: new Date().toISOString(),
          days_since_approval: 0,
          is_recently_approved: false,
        }
      }
    })

    // Categorize recipes for homepage sections
    const recentlyApproved = processedRecipes.filter((recipe) => recipe.is_recently_approved)
    const topRated = processedRecipes.filter((recipe) => recipe.rating >= 4.0).slice(0, 8)
    const allRecipes = processedRecipes

    console.log(`✅ [RECIPES-API] Successfully processed ${processedRecipes.length} recipes`)
    console.log(
      `📊 [RECIPES-API] Categories: ${recentlyApproved.length} recent, ${topRated.length} top-rated, ${allRecipes.length} total`,
    )

    return NextResponse.json({
      success: true,
      recipes: allRecipes, // For backward compatibility
      recentlyApproved,
      topRated,
      allRecipes,
      count: processedRecipes.length,
      debug: {
        query_params: { limit, search, category },
        total_found: recipes.length,
        recently_approved_count: recentlyApproved.length,
        top_rated_count: topRated.length,
        database_approved_count: approvedCheck[0]?.count || 0,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [RECIPES-API] Unexpected error fetching recipes:", error)

    // Log the full error details
    if (error instanceof Error) {
      console.error("❌ [RECIPES-API] Error name:", error.name)
      console.error("❌ [RECIPES-API] Error message:", error.message)
      console.error("❌ [RECIPES-API] Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
        recipes: [],
        recentlyApproved: [],
        topRated: [],
        allRecipes: [],
        count: 0,
        debug: {
          timestamp: new Date().toISOString(),
          error_type: error instanceof Error ? error.name : "Unknown",
          error_message: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    )
  }
}

// POST - Create new recipe
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [RECIPES-API] Creating new recipe")

    // Get user from session
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [RECIPES-API] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [RECIPES-API] User authenticated:", user.username)

    // Parse request body
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
      tags,
    } = body

    console.log("📝 [RECIPES-API] Recipe data received:", {
      title,
      category,
      difficulty,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      ingredientsCount: ingredients?.length || 0,
      instructionsCount: instructions?.length || 0,
    })

    // Validate required fields
    if (!title || !category || !difficulty) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: title, category, difficulty" },
        { status: 400 },
      )
    }

    // Generate unique recipe ID
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Prepare ingredients and instructions - handle empty arrays
    const processedIngredients = Array.isArray(ingredients) ? ingredients.filter((i) => i && i.trim()) : []
    const processedInstructions = Array.isArray(instructions) ? instructions.filter((i) => i && i.trim()) : []
    const processedTags = Array.isArray(tags) ? tags.filter((t) => t && t.trim()) : []

    // If arrays are empty, add placeholder content for testing
    if (processedIngredients.length === 0) {
      processedIngredients.push("No ingredients specified")
    }
    if (processedInstructions.length === 0) {
      processedInstructions.push("No instructions specified")
    }

    console.log("📝 [RECIPES-API] Processed data:", {
      recipeId,
      ingredientsCount: processedIngredients.length,
      instructionsCount: processedInstructions.length,
      tagsCount: processedTags.length,
    })

    // Insert recipe into database
    const result = await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, ingredients, 
        instructions, tags, moderation_status, is_published, rating, review_count, 
        view_count, created_at, updated_at
      )
      VALUES (
        ${recipeId}, ${title}, ${description || ""}, ${user.id}, ${user.username},
        ${category}, ${difficulty}, ${prep_time_minutes || 0}, ${cook_time_minutes || 0},
        ${servings || 1}, ${image_url || ""}, ${JSON.stringify(processedIngredients)}::jsonb,
        ${JSON.stringify(processedInstructions)}::jsonb, ${JSON.stringify(processedTags)}::jsonb,
        'pending', false, 0, 0, 0, NOW(), NOW()
      )
      RETURNING id, title, moderation_status, created_at
    `

    if (result.length === 0) {
      console.log("❌ [RECIPES-API] Failed to create recipe")
      return NextResponse.json({ success: false, error: "Failed to create recipe" }, { status: 500 })
    }

    const newRecipe = result[0]
    console.log("✅ [RECIPES-API] Recipe created successfully:", {
      id: newRecipe.id,
      title: newRecipe.title,
      status: newRecipe.moderation_status,
    })

    return NextResponse.json({
      success: true,
      message: "Recipe submitted successfully and is pending moderation",
      recipeId: newRecipe.id,
      recipe: newRecipe,
    })
  } catch (error) {
    console.error("❌ [RECIPES-API] Error creating recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
