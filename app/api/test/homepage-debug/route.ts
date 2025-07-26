import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { addLog } from "../server-logs/route"

export async function GET() {
  try {
    addLog("info", "🔍 [HOMEPAGE-DEBUG] Starting homepage debug analysis")

    // Step 1: Check all recipes in database
    const allRecipesResult = await sql`
      SELECT 
        id, title, author_username, moderation_status, is_published, 
        created_at, updated_at, rating, review_count, view_count,
        prep_time_minutes, cook_time_minutes, servings, category, difficulty
      FROM recipes 
      ORDER BY updated_at DESC
    `

    addLog("info", `📊 [HOMEPAGE-DEBUG] Found ${allRecipesResult.length} total recipes in database`)

    // Step 2: Filter approved and published recipes
    const approvedRecipes = allRecipesResult.filter(
      (recipe) => recipe.moderation_status === "approved" && recipe.is_published === true,
    )

    addLog("info", `✅ [HOMEPAGE-DEBUG] Found ${approvedRecipes.length} approved & published recipes`)

    // Step 3: Calculate days since approval for each recipe
    const recipesWithApprovalData = approvedRecipes.map((recipe) => {
      const now = new Date()
      const updatedDate = new Date(recipe.updated_at)
      const daysSinceApproval = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24))
      const isRecentlyApproved = daysSinceApproval <= 30

      return {
        ...recipe,
        days_since_approval: daysSinceApproval,
        is_recently_approved: isRecentlyApproved,
        approval_date: recipe.updated_at,
      }
    })

    // Step 4: Filter recently approved recipes (last 30 days)
    const recentlyApproved = recipesWithApprovalData.filter((recipe) => recipe.is_recently_approved)

    addLog("info", `🕒 [HOMEPAGE-DEBUG] Found ${recentlyApproved.length} recently approved recipes (last 30 days)`)

    // Step 5: Sort by approval date
    const sortedRecentRecipes = recentlyApproved.sort((a, b) => {
      const aDate = new Date(a.approval_date)
      const bDate = new Date(b.approval_date)
      return bDate.getTime() - aDate.getTime()
    })

    // Step 6: Test API endpoint response format
    const apiTestResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/recipes?limit=50`,
      {
        headers: { "Cache-Control": "no-cache" },
      },
    )

    let apiData = null
    let apiError = null

    try {
      apiData = await apiTestResponse.json()
      addLog("info", `📡 [HOMEPAGE-DEBUG] API endpoint returned ${apiData?.recipes?.length || 0} recipes`)
    } catch (error) {
      apiError = error instanceof Error ? error.message : "Unknown API error"
      addLog("error", `❌ [HOMEPAGE-DEBUG] API endpoint error: ${apiError}`)
    }

    // Step 7: Detailed recipe analysis
    const recipeAnalysis = sortedRecentRecipes.slice(0, 10).map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      author: recipe.author_username,
      status: recipe.moderation_status,
      published: recipe.is_published,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
      days_since_approval: recipe.days_since_approval,
      is_recently_approved: recipe.is_recently_approved,
      rating: Number(recipe.rating) || 0,
      review_count: Number(recipe.review_count) || 0,
      view_count: Number(recipe.view_count) || 0,
      prep_time: Number(recipe.prep_time_minutes) || 0,
      cook_time: Number(recipe.cook_time_minutes) || 0,
      servings: Number(recipe.servings) || 1,
      category: recipe.category,
      difficulty: recipe.difficulty,
      should_appear_on_homepage: recipe.is_recently_approved && recipe.days_since_approval <= 30,
    }))

    // Step 8: Check for common issues
    const issues = []

    if (allRecipesResult.length === 0) {
      issues.push("No recipes found in database")
    }

    if (approvedRecipes.length === 0) {
      issues.push("No approved recipes found")
    }

    if (recentlyApproved.length === 0) {
      issues.push("No recently approved recipes (last 30 days)")
    }

    if (apiError) {
      issues.push(`API endpoint error: ${apiError}`)
    }

    if (apiData && (!apiData.success || !Array.isArray(apiData.recipes))) {
      issues.push("API response format is incorrect")
    }

    const debugReport = {
      timestamp: new Date().toISOString(),
      summary: {
        total_recipes: allRecipesResult.length,
        approved_published: approvedRecipes.length,
        recently_approved: recentlyApproved.length,
        api_recipes_returned: apiData?.recipes?.length || 0,
        issues_found: issues.length,
      },
      issues,
      recently_approved_recipes: recipeAnalysis,
      api_response_sample: apiData
        ? {
            success: apiData.success,
            recipes_count: apiData.recipes?.length || 0,
            first_recipe: apiData.recipes?.[0]
              ? {
                  id: apiData.recipes[0].id,
                  title: apiData.recipes[0].title,
                  status: apiData.recipes[0].moderation_status,
                  published: apiData.recipes[0].is_published,
                  is_recently_approved: apiData.recipes[0].is_recently_approved,
                }
              : null,
          }
        : { error: apiError },
      database_sample: allRecipesResult.slice(0, 5).map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        status: recipe.moderation_status,
        published: recipe.is_published,
        updated_at: recipe.updated_at,
      })),
    }

    addLog("info", "✅ [HOMEPAGE-DEBUG] Debug analysis completed", debugReport)

    return NextResponse.json({
      success: true,
      debug: debugReport,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    addLog("error", `❌ [HOMEPAGE-DEBUG] Debug analysis failed: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        debug: {
          timestamp: new Date().toISOString(),
          error: "Failed to complete debug analysis",
        },
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    addLog("info", "🧪 [HOMEPAGE-DEBUG] Creating test recipe for homepage testing")

    // Create a test recipe that should appear on homepage
    const testRecipe = {
      id: `test_recipe_${Date.now()}`,
      title: `Test Recipe for Homepage - ${new Date().toLocaleString()}`,
      description: "This is a test recipe created to verify homepage functionality",
      author_id: "test_user",
      author_username: "Test User",
      category: "Test",
      difficulty: "Easy",
      prep_time_minutes: 10,
      cook_time_minutes: 15,
      servings: 4,
      image_url: "/placeholder.svg?height=200&width=300",
      ingredients: JSON.stringify(["1 cup test ingredient", "2 tbsp test spice", "3 test items"]),
      instructions: JSON.stringify(["Mix test ingredients", "Cook for test time", "Serve test recipe"]),
      tags: JSON.stringify(["test", "homepage", "debug"]),
      moderation_status: "approved",
      is_published: true,
      rating: 4.5,
      review_count: 10,
      view_count: 25,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert test recipe
    await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, ingredients,
        instructions, tags, moderation_status, is_published, rating, review_count,
        view_count, created_at, updated_at
      ) VALUES (
        ${testRecipe.id}, ${testRecipe.title}, ${testRecipe.description},
        ${testRecipe.author_id}, ${testRecipe.author_username}, ${testRecipe.category},
        ${testRecipe.difficulty}, ${testRecipe.prep_time_minutes}, ${testRecipe.cook_time_minutes},
        ${testRecipe.servings}, ${testRecipe.image_url}, ${testRecipe.ingredients}::jsonb,
        ${testRecipe.instructions}::jsonb, ${testRecipe.tags}::jsonb,
        ${testRecipe.moderation_status}, ${testRecipe.is_published}, ${testRecipe.rating},
        ${testRecipe.review_count}, ${testRecipe.view_count}, ${testRecipe.created_at},
        ${testRecipe.updated_at}
      )
    `

    addLog("info", `✅ [HOMEPAGE-DEBUG] Test recipe created: ${testRecipe.id}`)

    // Verify the recipe was created and should appear on homepage
    const verifyResult = await sql`
      SELECT id, title, moderation_status, is_published, updated_at
      FROM recipes 
      WHERE id = ${testRecipe.id}
    `

    if (verifyResult.length === 0) {
      throw new Error("Test recipe was not created successfully")
    }

    const createdRecipe = verifyResult[0]
    const daysSinceApproval = 0 // Just created
    const shouldAppearOnHomepage = daysSinceApproval <= 30

    addLog("info", "✅ [HOMEPAGE-DEBUG] Test recipe verified", {
      id: createdRecipe.id,
      title: createdRecipe.title,
      status: createdRecipe.moderation_status,
      published: createdRecipe.is_published,
      days_since_approval: daysSinceApproval,
      should_appear_on_homepage: shouldAppearOnHomepage,
    })

    return NextResponse.json({
      success: true,
      message: "Test recipe created successfully",
      test_recipe: {
        id: testRecipe.id,
        title: testRecipe.title,
        status: createdRecipe.moderation_status,
        published: createdRecipe.is_published,
        days_since_approval: daysSinceApproval,
        should_appear_on_homepage: shouldAppearOnHomepage,
        created_at: createdRecipe.updated_at,
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    addLog("error", `❌ [HOMEPAGE-DEBUG] Failed to create test recipe: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    addLog("info", "🧹 [HOMEPAGE-DEBUG] Cleaning up test recipes")

    // Delete all test recipes
    const deleteResult = await sql`
      DELETE FROM recipes 
      WHERE title LIKE 'Test Recipe for Homepage%' OR id LIKE 'test_recipe_%'
      RETURNING id, title
    `

    addLog("info", `✅ [HOMEPAGE-DEBUG] Deleted ${deleteResult.length} test recipes`)

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteResult.length} test recipes`,
      deleted_recipes: deleteResult.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
      })),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    addLog("error", `❌ [HOMEPAGE-DEBUG] Failed to clean up test recipes: ${errorMessage}`)

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
