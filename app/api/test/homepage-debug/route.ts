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

    // Step 1: Test database connection
    console.log("📊 [HOMEPAGE-DEBUG] Step 1: Testing database connection")
    try {
      await sql`SELECT 1 as test`
      analysis.steps.push({
        step: 1,
        name: "Database Connection Test",
        result: "Database connection successful",
        status: "success",
        data: { connection: "active" },
      })
    } catch (dbError) {
      analysis.steps.push({
        step: 1,
        name: "Database Connection Test",
        result: "Database connection failed",
        status: "error",
        data: { error: dbError instanceof Error ? dbError.message : "Unknown database error" },
      })
      analysis.issues.push("Database connection is not working")

      return NextResponse.json({
        success: true,
        analysis,
        recommendations: ["Fix database connection before proceeding"],
      })
    }

    // Step 2: Check total recipes in database
    console.log("📊 [HOMEPAGE-DEBUG] Step 2: Checking total recipes")
    try {
      const totalRecipes = await sql`SELECT COUNT(*) as count FROM recipes`
      const totalCount = Number(totalRecipes[0]?.count) || 0

      analysis.steps.push({
        step: 2,
        name: "Total Recipes in Database",
        result: `${totalCount} recipes found`,
        status: totalCount > 0 ? "success" : "warning",
        data: { total_recipes: totalCount },
      })

      if (totalCount === 0) {
        analysis.issues.push("No recipes found in database")
      }
    } catch (error) {
      analysis.steps.push({
        step: 2,
        name: "Total Recipes in Database",
        result: "Failed to count recipes",
        status: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      })
      analysis.issues.push("Cannot access recipes table")
    }

    // Step 3: Check approved and published recipes
    console.log("📊 [HOMEPAGE-DEBUG] Step 3: Checking approved & published recipes")
    try {
      const approvedRecipes = await sql`
        SELECT COUNT(*) as count 
        FROM recipes 
        WHERE moderation_status = 'approved' AND is_published = true
      `
      const approvedCount = Number(approvedRecipes[0]?.count) || 0

      analysis.steps.push({
        step: 3,
        name: "Approved & Published Recipes",
        result: `${approvedCount} recipes ready for display`,
        status: approvedCount > 0 ? "success" : "error",
        data: { approved_published: approvedCount },
      })

      if (approvedCount === 0) {
        analysis.issues.push("No approved and published recipes available for homepage")
      }
    } catch (error) {
      analysis.steps.push({
        step: 3,
        name: "Approved & Published Recipes",
        result: "Failed to check approved recipes",
        status: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      })
      analysis.issues.push("Cannot check recipe approval status")
    }

    // Step 4: Check recently approved recipes (last 30 days)
    console.log("📊 [HOMEPAGE-DEBUG] Step 4: Checking recently approved recipes")
    try {
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
        step: 4,
        name: "Recently Approved (Last 30 Days)",
        result: `${recentCount} recently approved recipes`,
        status: recentCount > 0 ? "success" : "warning",
        data: {
          recent_count: recentCount,
          oldest_approval: recentlyApproved[0]?.oldest_approval,
          newest_approval: recentlyApproved[0]?.newest_approval,
        },
      })

      if (recentCount === 0) {
        analysis.issues.push(
          "No recently approved recipes (last 30 days) - older recipes won't show 'Recently Approved' badge",
        )
      }
    } catch (error) {
      analysis.steps.push({
        step: 4,
        name: "Recently Approved (Last 30 Days)",
        result: "Failed to check recent approvals",
        status: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      })
      analysis.issues.push("Cannot check recent recipe approvals")
    }

    // Step 5: Test API endpoint directly
    console.log("📊 [HOMEPAGE-DEBUG] Step 5: Testing recipes API endpoint")
    try {
      const apiUrl = new URL("/api/recipes", request.url)
      apiUrl.searchParams.set("limit", "10")

      const apiResponse = await fetch(apiUrl.toString(), {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      })

      const apiData = await apiResponse.json()

      analysis.steps.push({
        step: 5,
        name: "Recipes API Endpoint Test",
        result: `API returned ${apiData.recipes?.length || 0} recipes`,
        status: apiData.success ? "success" : "error",
        data: {
          api_success: apiData.success,
          api_recipe_count: apiData.recipes?.length || 0,
          api_error: apiData.error || null,
          api_details: apiData.details || null,
        },
      })

      if (!apiData.success) {
        analysis.issues.push(`API endpoint error: ${apiData.error}`)
      }
    } catch (apiError) {
      analysis.steps.push({
        step: 5,
        name: "Recipes API Endpoint Test",
        result: "API test failed",
        status: "error",
        data: { error: apiError instanceof Error ? apiError.message : "Unknown API error" },
      })
      analysis.issues.push("API endpoint is not responding correctly")
    }

    // Step 6: Sample recipe data
    console.log("📊 [HOMEPAGE-DEBUG] Step 6: Getting sample recipe data")
    try {
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
        step: 6,
        name: "Sample Recipe Data",
        result: `Retrieved ${sampleRecipes.length} sample recipes`,
        status: sampleRecipes.length > 0 ? "success" : "warning",
        data: { sample_recipes: sampleRecipes },
      })
    } catch (error) {
      analysis.steps.push({
        step: 6,
        name: "Sample Recipe Data",
        result: "Failed to retrieve sample recipes",
        status: "error",
        data: { error: error instanceof Error ? error.message : "Unknown error" },
      })
      analysis.issues.push("Cannot retrieve sample recipe data")
    }

    // Summary
    const totalSteps = analysis.steps.length
    const successfulSteps = analysis.steps.filter((step) => step.status === "success").length
    const errorSteps = analysis.steps.filter((step) => step.status === "error").length

    analysis.summary = {
      total_steps: totalSteps,
      successful_steps: successfulSteps,
      error_steps: errorSteps,
      issues_found: analysis.issues.length,
      overall_status: errorSteps === 0 ? "healthy" : "issues_detected",
    }

    console.log("✅ [HOMEPAGE-DEBUG] Analysis complete:", analysis.summary)

    const recommendations = []
    if (analysis.issues.length === 0) {
      recommendations.push("System appears to be working correctly")
      recommendations.push("Recipes should be displaying on homepage")
    } else {
      recommendations.push("Check if recipes are being properly approved in admin panel")
      recommendations.push("Verify recipe moderation_status and is_published fields")
      recommendations.push("Ensure API endpoint is working correctly")
      recommendations.push("Check server logs for detailed error information")
    }

    return NextResponse.json({
      success: true,
      analysis,
      recommendations,
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
    const apiResponse = await fetch(apiUrl.toString(), {
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    })
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
