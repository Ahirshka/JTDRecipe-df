import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [DB-TEST] Starting database connection test")

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      steps: [] as Array<{ step: number; name: string; success: boolean; data?: any; error?: string }>,
      summary: {
        success: false,
        message: "",
        totalSteps: 8,
        passedSteps: 0,
      },
    }

    // Step 1: Test basic connection
    console.log("🔍 [DB-TEST] Step 1: Testing basic connection...")
    try {
      await sql`SELECT 1 as test`
      testResults.steps.push({
        step: 1,
        name: "Basic Connection",
        success: true,
        data: { message: "Database connection successful" },
      })
      testResults.summary.passedSteps++
      console.log("✅ [DB-TEST] Basic connection successful")
    } catch (error) {
      testResults.steps.push({
        step: 1,
        name: "Basic Connection",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Basic connection failed:", error)
    }

    // Step 2: Check required tables
    console.log("🔍 [DB-TEST] Step 2: Checking required tables...")
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `

      const tableNames = tables.map((t: any) => t.table_name)
      const requiredTables = ["users", "recipes", "sessions"]
      const missingTables = requiredTables.filter((table) => !tableNames.includes(table))

      testResults.steps.push({
        step: 2,
        name: "Required Tables",
        success: missingTables.length === 0,
        data: {
          existing: tableNames,
          required: requiredTables,
          missing: missingTables,
        },
      })

      if (missingTables.length === 0) {
        testResults.summary.passedSteps++
        console.log("✅ [DB-TEST] All required tables exist")
      } else {
        console.log("❌ [DB-TEST] Missing tables:", missingTables)
      }
    } catch (error) {
      testResults.steps.push({
        step: 2,
        name: "Required Tables",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Table check failed:", error)
    }

    // Step 3: Check users table structure
    console.log("🔍 [DB-TEST] Step 3: Checking users table structure...")
    try {
      const userColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `

      testResults.steps.push({
        step: 3,
        name: "Users Table Structure",
        success: true,
        data: { columns: userColumns },
      })
      testResults.summary.passedSteps++
      console.log("✅ [DB-TEST] Users table structure retrieved")
    } catch (error) {
      testResults.steps.push({
        step: 3,
        name: "Users Table Structure",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Users table structure check failed:", error)
    }

    // Step 4: Check recipes table structure
    console.log("🔍 [DB-TEST] Step 4: Checking recipes table structure...")
    try {
      const recipeColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'recipes'
        ORDER BY ordinal_position
      `

      testResults.steps.push({
        step: 4,
        name: "Recipes Table Structure",
        success: true,
        data: { columns: recipeColumns },
      })
      testResults.summary.passedSteps++
      console.log("✅ [DB-TEST] Recipes table structure retrieved")
    } catch (error) {
      testResults.steps.push({
        step: 4,
        name: "Recipes Table Structure",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Recipes table structure check failed:", error)
    }

    // Step 5: Count records
    console.log("🔍 [DB-TEST] Step 5: Counting records...")
    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`

      // Try to count other tables if they exist
      let ratingCount = 0
      let commentCount = 0

      try {
        const ratings = await sql`SELECT COUNT(*) as count FROM ratings`
        ratingCount = Number.parseInt(ratings[0]?.count || "0")
      } catch {
        // Table might not exist
      }

      try {
        const comments = await sql`SELECT COUNT(*) as count FROM comments`
        commentCount = Number.parseInt(comments[0]?.count || "0")
      } catch {
        // Table might not exist
      }

      const counts = {
        users: Number.parseInt(userCount[0]?.count || "0"),
        recipes: Number.parseInt(recipeCount[0]?.count || "0"),
        ratings: ratingCount,
        comments: commentCount,
      }

      testResults.steps.push({
        step: 5,
        name: "Record Counts",
        success: true,
        data: counts,
      })
      testResults.summary.passedSteps++

      console.log("📊 [DB-TEST] Users count:", counts.users)
      console.log("📊 [DB-TEST] Recipes count:", counts.recipes)
      console.log("📊 [DB-TEST] Ratings count:", counts.ratings)
      console.log("📊 [DB-TEST] Comments count:", counts.comments)
    } catch (error) {
      testResults.steps.push({
        step: 5,
        name: "Record Counts",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Record counting failed:", error)
    }

    // Step 6: Check for admin users
    console.log("🔍 [DB-TEST] Step 6: Checking for admin users...")
    try {
      const adminUsers = await sql`
        SELECT username, role, status
        FROM users
        WHERE role IN ('admin', 'owner', 'moderator')
        ORDER BY role, username
      `

      testResults.steps.push({
        step: 6,
        name: "Admin Users",
        success: true,
        data: {
          count: adminUsers.length,
          users: adminUsers,
        },
      })
      testResults.summary.passedSteps++

      console.log("👑 [DB-TEST] Admin users found:", adminUsers.length)
      adminUsers.forEach((user: any) => {
        console.log(`  - ${user.username} (${user.role}) - ${user.status}`)
      })
    } catch (error) {
      testResults.steps.push({
        step: 6,
        name: "Admin Users",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Admin user check failed:", error)
    }

    // Step 7: Check sample recipes
    console.log("🔍 [DB-TEST] Step 7: Checking sample recipes...")
    try {
      const sampleRecipes = await sql`
        SELECT id, title, author_username, moderation_status
        FROM recipes
        ORDER BY created_at DESC
        LIMIT 5
      `

      testResults.steps.push({
        step: 7,
        name: "Sample Recipes",
        success: true,
        data: {
          count: sampleRecipes.length,
          recipes: sampleRecipes,
        },
      })
      testResults.summary.passedSteps++

      console.log("🍳 [DB-TEST] Sample recipes found:", sampleRecipes.length)
      sampleRecipes.forEach((recipe: any) => {
        console.log(`  - ${recipe.title} by ${recipe.author_username} (${recipe.moderation_status})`)
      })
    } catch (error) {
      testResults.steps.push({
        step: 7,
        name: "Sample Recipes",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Sample recipe check failed:", error)
    }

    // Step 8: Check foreign key constraints
    console.log("🔍 [DB-TEST] Step 8: Checking foreign key constraints...")
    try {
      const constraints = await sql`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        ORDER BY tc.table_name, tc.constraint_name
      `

      testResults.steps.push({
        step: 8,
        name: "Foreign Key Constraints",
        success: true,
        data: {
          count: constraints.length,
          constraints: constraints,
        },
      })
      testResults.summary.passedSteps++

      console.log("🔗 [DB-TEST] Foreign key constraints found:", constraints.length)
    } catch (error) {
      testResults.steps.push({
        step: 8,
        name: "Foreign Key Constraints",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      console.log("❌ [DB-TEST] Foreign key constraint check failed:", error)
    }

    // Final summary
    testResults.summary.success = testResults.summary.passedSteps === testResults.summary.totalSteps
    testResults.summary.message = testResults.summary.success
      ? "All database tests passed successfully"
      : `${testResults.summary.passedSteps}/${testResults.summary.totalSteps} tests passed`

    console.log("✅ [DB-TEST] Database test completed successfully")

    return NextResponse.json({
      success: true,
      message: "Database connection test completed",
      data: testResults,
    })
  } catch (error) {
    console.error("❌ [DB-TEST] Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
