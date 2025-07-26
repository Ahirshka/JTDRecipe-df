import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function GET() {
  try {
    console.log("🔄 [HOMEPAGE-DEBUG] Starting comprehensive analysis...")

    const results = {
      timestamp: new Date().toISOString(),
      steps: [] as any[],
      summary: {} as any,
    }

    // Step 1: Test database connection
    try {
      await sql`SELECT 1`
      results.steps.push({
        step: 1,
        name: "Database Connection",
        status: "✅ SUCCESS",
        details: "Database connection successful",
      })
    } catch (error) {
      results.steps.push({
        step: 1,
        name: "Database Connection",
        status: "❌ FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      return NextResponse.json(results)
    }

    // Step 2: Check total recipes in database
    const totalRecipes = await sql`SELECT COUNT(*) as count FROM recipes`
    results.steps.push({
      step: 2,
      name: "Total Recipes in Database",
      status: totalRecipes[0]?.count > 0 ? "✅ SUCCESS" : "⚠️ WARNING",
      details: `Found ${totalRecipes[0]?.count || 0} total recipes`,
      count: totalRecipes[0]?.count || 0,
    })

    // Step 3: Check recipe statuses
    const statusBreakdown = await sql`
      SELECT 
        moderation_status, 
        is_published, 
        COUNT(*) as count 
      FROM recipes 
      GROUP BY moderation_status, is_published
      ORDER BY moderation_status, is_published
    `
    results.steps.push({
      step: 3,
      name: "Recipe Status Breakdown",
      status: "ℹ️ INFO",
      details: statusBreakdown,
    })

    // Step 4: Check approved and published recipes
    const approvedPublished = await sql`
      SELECT COUNT(*) as count 
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
    `
    results.steps.push({
      step: 4,
      name: "Approved & Published Recipes",
      status: approvedPublished[0]?.count > 0 ? "✅ SUCCESS" : "❌ FAILED",
      details: `Found ${approvedPublished[0]?.count || 0} approved and published recipes`,
      count: approvedPublished[0]?.count || 0,
    })

    // Step 5: Sample approved recipes
    const sampleApproved = await sql`
      SELECT 
        id, title, author_username, moderation_status, is_published, 
        created_at, updated_at
      FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
      ORDER BY updated_at DESC
      LIMIT 5
    `
    results.steps.push({
      step: 5,
      name: "Sample Approved Recipes",
      status: sampleApproved.length > 0 ? "✅ SUCCESS" : "❌ FAILED",
      details: sampleApproved.length > 0 ? "Sample recipes found" : "No approved recipes found",
      recipes: sampleApproved,
    })

    // Step 6: Test API endpoint
    try {
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/recipes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const apiData = await apiResponse.json()

      results.steps.push({
        step: 6,
        name: "API Endpoint Test",
        status: apiData.success ? "✅ SUCCESS" : "❌ FAILED",
        details: apiData.success
          ? `API returned ${apiData.count || 0} recipes`
          : `API error: ${apiData.error || "Unknown error"}`,
        apiResponse: {
          success: apiData.success,
          count: apiData.count,
          error: apiData.error,
          recentlyApprovedCount: apiData.recentlyApproved?.length || 0,
          topRatedCount: apiData.topRated?.length || 0,
          allRecipesCount: apiData.allRecipes?.length || 0,
        },
      })
    } catch (apiError) {
      results.steps.push({
        step: 6,
        name: "API Endpoint Test",
        status: "❌ FAILED",
        error: apiError instanceof Error ? apiError.message : "Unknown API error",
      })
    }

    // Step 7: Check for pending recipes that need approval
    const pendingRecipes = await sql`
      SELECT COUNT(*) as count 
      FROM recipes 
      WHERE moderation_status = 'pending'
    `
    results.steps.push({
      step: 7,
      name: "Pending Recipes (Need Approval)",
      status: "ℹ️ INFO",
      details: `Found ${pendingRecipes[0]?.count || 0} recipes pending approval`,
      count: pendingRecipes[0]?.count || 0,
    })

    // Summary
    results.summary = {
      totalRecipes: totalRecipes[0]?.count || 0,
      approvedPublished: approvedPublished[0]?.count || 0,
      pendingApproval: pendingRecipes[0]?.count || 0,
      hasApprovedRecipes: (approvedPublished[0]?.count || 0) > 0,
      recommendation:
        (approvedPublished[0]?.count || 0) === 0
          ? "No approved recipes found. You need to approve some recipes in the admin panel first."
          : "Approved recipes exist. Check API endpoint for issues.",
    }

    console.log("✅ [HOMEPAGE-DEBUG] Analysis complete:", results.summary)

    return NextResponse.json(results)
  } catch (error) {
    console.error("❌ [HOMEPAGE-DEBUG] Analysis failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Debug analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
