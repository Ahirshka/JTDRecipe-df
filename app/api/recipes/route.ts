import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { addLog } from "../test/server-logs/route"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    addLog("info", `📡 [RECIPES-API] Fetching recipes with params:`, {
      limit,
      offset,
      category,
      search,
    })

    // Build the query with filters
    let query = `
      SELECT 
        r.id, r.title, r.description, r.author_id, r.author_username,
        r.category, r.difficulty, r.prep_time_minutes, r.cook_time_minutes,
        r.servings, r.image_url, r.ingredients, r.instructions, r.tags,
        r.moderation_status, r.is_published, r.rating, r.review_count,
        r.view_count, r.created_at, r.updated_at,
        -- Calculate days since approval and recently approved status
        EXTRACT(DAY FROM (NOW() - r.updated_at)) as days_since_approval,
        CASE 
          WHEN EXTRACT(DAY FROM (NOW() - r.updated_at)) <= 30 THEN true 
          ELSE false 
        END as is_recently_approved,
        r.updated_at as approval_date
      FROM recipes r
      WHERE r.moderation_status = 'approved' 
        AND r.is_published = true
    `

    const params: any[] = []
    let paramIndex = 1

    if (category) {
      query += ` AND r.category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (search) {
      query += ` AND (r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    query += ` ORDER BY r.updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    addLog("info", `🔍 [RECIPES-API] Executing query with ${params.length} parameters`)

    // Execute the query
    const recipes = await sql.unsafe(query, params)

    addLog("info", `📊 [RECIPES-API] Found ${recipes.length} recipes`)

    // Process each recipe to ensure proper data types and add debugging info
    const processedRecipes = recipes.map((recipe, index) => {
      const processedRecipe = {
        id: recipe.id,
        title: recipe.title || "Untitled Recipe",
        description: recipe.description || "",
        author_id: recipe.author_id,
        author_username: recipe.author_username || "Unknown Author",
        category: recipe.category || "Other",
        difficulty: recipe.difficulty || "Medium",
        prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
        cook_time_minutes: Number(recipe.cook_time_minutes) || 0,
        servings: Number(recipe.servings) || 1,
        image_url: recipe.image_url || "",
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        tags: recipe.tags,
        moderation_status: recipe.moderation_status,
        is_published: recipe.is_published,
        rating: Number(recipe.rating) || 0,
        review_count: Number(recipe.review_count) || 0,
        view_count: Number(recipe.view_count) || 0,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
        days_since_approval: Number(recipe.days_since_approval) || 0,
        is_recently_approved: recipe.is_recently_approved === true,
        approval_date: recipe.approval_date,
      }

      // Log details for recently approved recipes
      if (processedRecipe.is_recently_approved) {
        addLog("info", `🆕 [RECIPES-API] Recently approved recipe ${index + 1}:`, {
          id: processedRecipe.id,
          title: processedRecipe.title,
          days_since_approval: processedRecipe.days_since_approval,
          approval_date: processedRecipe.approval_date,
        })
      }

      return processedRecipe
    })

    // Count recently approved recipes for debugging
    const recentlyApprovedCount = processedRecipes.filter((r) => r.is_recently_approved).length

    addLog(
      "info",
      `✅ [RECIPES-API] Processed ${processedRecipes.length} recipes, ${recentlyApprovedCount} recently approved`,
    )

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM recipes r
      WHERE r.moderation_status = 'approved' 
        AND r.is_published = true
    `

    const countParams: any[] = []
    let countParamIndex = 1

    if (category) {
      countQuery += ` AND r.category = $${countParamIndex}`
      countParams.push(category)
      countParamIndex++
    }

    if (search) {
      countQuery += ` AND (r.title ILIKE $${countParamIndex} OR r.description ILIKE $${countParamIndex})`
      countParams.push(`%${search}%`)
    }

    const totalResult = await sql.unsafe(countQuery, countParams)
    const total = Number(totalResult[0]?.total) || 0

    const response = {
      success: true,
      recipes: processedRecipes,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
      debug: {
        query_params: { limit, offset, category, search },
        total_found: recipes.length,
        recently_approved_count: recentlyApprovedCount,
        timestamp: new Date().toISOString(),
      },
    }

    addLog("info", `📤 [RECIPES-API] Returning response with ${processedRecipes.length} recipes`)

    return NextResponse.json(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    addLog("error", `❌ [RECIPES-API] Error fetching recipes: ${errorMessage}`)

    console.error("Error fetching recipes:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch recipes",
        details: errorMessage,
        debug: {
          timestamp: new Date().toISOString(),
          error: errorMessage,
        },
      },
      { status: 500 },
    )
  }
}
