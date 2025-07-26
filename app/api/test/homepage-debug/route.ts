import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

// GET - Debug homepage recipe display
export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [HOMEPAGE-DEBUG] Starting homepage debug analysis")

    // Check if user is admin/owner
    const user = await getCurrentUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const analysis = {
      timestamp: new Date().toISOString(),
      steps: [],
      issues: [],
      summary: {},
    }

    // Step 1: Check total recipes in database
    console.log("📊 [HOMEPAGE-DEBUG] Step 1: Checking total recipes")
    const totalRecipes = await sql`SELECT COUNT(*) as count FROM recipes`
    const totalCount = Number(totalRecipes[0]?.count) || 0

    analysis.steps.push({
      step: 1,
      name: "Total Recipes in Database",
      result: `${totalCount} recipes found`,
      status: totalCount > 0 ? "success" : "warning",
      data: { total_recipes: totalCount },
    })

    if (totalCount === 0) {
      analysis.issues.push("No recipes found in database")
    }

    // Step 2: Check approved and published recipes
    console.log("📊 [HOMEPAGE-DEBUG] Step 2: Checking approved & published recipes")
    const approvedRecipes = await sql`
      SELECT COUNT(*) as count 
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
    `
    const approvedCount = Number(approvedRecipes[0]?.count) || 0

    analysis.steps.push({
      step: 2,
      name: "Approved & Published Recipes",
      result: `${approvedCount} recipes ready for display`,
      status: approvedCount > 0 ? "success" : "error",
      data: { approved_published: approvedCount },
    })

    if (approvedCount === 0) {
      analysis.issues.push("No approved and published recipes available for homepage")
    }

    // Step 3: Check recently approved recipes (last 30 days)
    console.log("📊 [HOMEPAGE-DEBUG] Step 3: Checking recently approved recipes")
    const recentlyApproved = await sql`
      SELECT 
        COUNT(*) as count,
        MIN(updated_at) as oldest_approval,
        MAX(updated_at) as newest_approval
      FROM recipes 
      WHERE moderation_status = 'approved' 
        AND is_published = true
        AND updated_at >= NOW() - INTERVAL '30 days'
    `
    const recentCount = Number(recentlyApproved[0]?.count) || 0

    analysis.steps.push({
      step: 3,
      name: "Recently Approved (Last 30 Days)",
      result: `${recentCount} recently approved recipes`,
      status: recentCount > 0 ? "success" : "warning",
      data: {
        recent_count: recentCount,
        oldest_approval: recentlyApproved[0]?.oldest_approval,
        newest_approval: recentlyApproved[0]?.newest_approval,
      },
    })

    if (recentCount === 0 && approvedCount > 0) {
      analysis.issues.push(
        "No recently approved recipes (last 30 days) - older recipes won't show 'Recently Approved' badge",
      )
    }

    // Step 4: Test API endpoint
    console.log("📊 [HOMEPAGE-DEBUG] Step 4: Testing recipes API endpoint")
    try {
      const apiUrl = new URL("/api/recipes", request.url)
      const apiResponse = await fetch(apiUrl.toString())
      const apiData = await apiResponse.json()

      analysis.steps.push({
        step: 4,
        name: "Recipes API Endpoint Test",
        result: `API returned ${apiData.recipes?.length || 0} recipes`,
        status: apiData.success ? "success" : "error",
        data: {
          api_success: apiData.success,
          api_recipe_count: apiData.recipes?.length || 0,
          api_error: apiData.error || null,
        },
      })

      if (!apiData.success) {
        analysis.issues.push(`API endpoint error: ${apiData.error}`)
      }
    } catch (apiError) {
      analysis.steps.push({
        step: 4,
        name: "Recipes API Endpoint Test",
        result: "API test failed",
        status: "error",
        data: { error: apiError instanceof Error ? apiError.message : "Unknown API error" },
      })
      analysis.issues.push("API endpoint is not responding correctly")
    }

    // Step 5: Sample recipe data
    console.log("📊 [HOMEPAGE-DEBUG] Step 5: Getting sample recipe data")
    const sampleRecipes = await sql`
      SELECT 
        id, title, author_username, moderation_status, is_published,
        created_at, updated_at,
        EXTRACT(DAY FROM (NOW() - updated_at)) as days_since_approval
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
      ORDER BY updated_at DESC
      LIMIT 5
    `

    analysis.steps.push({
      step: 5,
      name: "Sample Recipe Data",
      result: `Retrieved ${sampleRecipes.length} sample recipes`,
      status: sampleRecipes.length > 0 ? "success" : "warning",
      data: { sample_recipes: sampleRecipes },
    })

    // Summary
    analysis.summary = {
      total_recipes: totalCount,
      approved_published: approvedCount,
      recently_approved: recentCount,
      issues_found: analysis.issues.length,
      overall_status: analysis.issues.length === 0 ? "healthy" : "issues_detected",
    }

    console.log("✅ [HOMEPAGE-DEBUG] Analysis complete:", analysis.summary)

    return NextResponse.json({
      success: true,
      analysis,
      recommendations:
        analysis.issues.length > 0
          ? [
              "Check if recipes are being properly approved in admin panel",
              "Verify recipe moderation_status and is_published fields",
              "Ensure API endpoint is working correctly",
              "Check if recently approved recipes exist",
            ]
          : ["System appears to be working correctly", "Recipes should be displaying on homepage"],
    })
  } catch (error) {
    console.error("❌ [HOMEPAGE-DEBUG] Analysis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create test recipe for homepage testing
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [HOMEPAGE-DEBUG] Creating test recipe")

    // Check if user is admin/owner
    const user = await getCurrentUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Generate test recipe data
    const testRecipeId = `test_recipe_${Date.now()}`
    const testTitle = `Test Recipe ${new Date().toLocaleTimeString()}`

    console.log("📝 [HOMEPAGE-DEBUG] Creating test recipe:", testRecipeId)

    // Create test recipe
    const createResult = await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url, ingredients, 
        instructions, tags, moderation_status, is_published, rating, review_count, 
        view_count, created_at, updated_at
      )
      VALUES (
        ${testRecipeId}, ${testTitle}, 'This is a test recipe for homepage debugging',
        ${user.id}, ${user.username}, 'test', 'easy', 15, 30, 4,
        '/placeholder.svg?height=300&width=400&text=Test+Recipe',
        ${JSON.stringify(["Test ingredient 1", "Test ingredient 2", "Test ingredient 3"])}::jsonb,
        ${JSON.stringify(["Step 1: Test instruction", "Step 2: Another test step", "Step 3: Final step"])}::jsonb,
        ${JSON.stringify(["test", "debug", "homepage"])}::jsonb,
        'approved', true, 4.5, 10, 25, NOW() - INTERVAL '1 day', NOW()
      )
      RETURNING id, title, moderation_status, is_published, created_at, updated_at
    `

    if (createResult.length === 0) {
      throw new Error("Failed to create test recipe")
    }

    const testRecipe = createResult[0]
    console.log("✅ [HOMEPAGE-DEBUG] Test recipe created:", testRecipe)

    // Verify it appears in API
    const apiUrl = new URL("/api/recipes", request.url)
    const apiResponse = await fetch(apiUrl.toString())
    const apiData = await apiResponse.json()

    const testRecipeInApi = apiData.recipes?.find((r: any) => r.id === testRecipeId)

    return NextResponse.json({
      success: true,
      message: "Test recipe created successfully",
      test_recipe: testRecipe,
      verification: {
        appears_in_api: !!testRecipeInApi,
        api_recipe_count: apiData.recipes?.length || 0,
        test_recipe_data: testRecipeInApi || null,
      },
    })
  } catch (error) {
    console.error("❌ [HOMEPAGE-DEBUG] Error creating test recipe:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create test recipe",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Clean up test recipes
export async function DELETE(request: NextRequest) {
  try {
    console.log("🔄 [HOMEPAGE-DEBUG] Cleaning up test recipes")

    // Check if user is admin/owner
    const user = await getCurrentUserFromRequest(request)
    if (!user || (user.role !== "admin" && user.role !== "owner")) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    // Delete test recipes
    const deleteResult = await sql`
      DELETE FROM recipes 
      WHERE id LIKE 'test_recipe_%' OR category = 'test'
      RETURNING id, title
    `

    console.log(`✅ [HOMEPAGE-DEBUG] Deleted ${deleteResult.length} test recipes`)

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleteResult.length} test recipes`,
      deleted_recipes: deleteResult,
    })
  } catch (error) {
    console.error("❌ [HOMEPAGE-DEBUG] Error cleaning up test recipes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clean up test recipes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
