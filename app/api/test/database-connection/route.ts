import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  console.log("🔍 [DB-CONNECTION-TEST] Starting database connection test...")

  try {
    const testResults: any = {
      timestamp: new Date().toISOString(),
      databaseUrl: !!process.env.DATABASE_URL,
      tests: [],
    }

    // Test 1: Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      testResults.tests.push({
        name: "Environment Variable Check",
        status: "error",
        message: "DATABASE_URL environment variable not found",
      })
      testResults.success = false
      return NextResponse.json(testResults, { status: 500 })
    }

    testResults.tests.push({
      name: "Environment Variable Check",
      status: "success",
      message: "DATABASE_URL found",
    })

    // Test 2: Basic connection test
    try {
      const result = await sql`SELECT 1 as test`
      testResults.tests.push({
        name: "Basic Connection",
        status: "success",
        message: "Database connection successful",
        data: result,
      })
    } catch (connectionError) {
      testResults.tests.push({
        name: "Basic Connection",
        status: "error",
        message: `Connection failed: ${connectionError.message}`,
        error: connectionError.message,
      })
      testResults.success = false
      return NextResponse.json(testResults, { status: 500 })
    }

    // Test 3: Check if users table exists
    try {
      const usersCheck = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'users'
      `
      const usersExist = Number.parseInt(usersCheck[0].count) > 0
      testResults.tests.push({
        name: "Users Table Check",
        status: usersExist ? "success" : "error",
        message: usersExist ? "Users table exists" : "Users table not found",
        data: { exists: usersExist },
      })
    } catch (tableError) {
      testResults.tests.push({
        name: "Users Table Check",
        status: "error",
        message: `Table check failed: ${tableError.message}`,
        error: tableError.message,
      })
    }

    // Test 4: Check if recipes table exists
    try {
      const recipesCheck = await sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'recipes'
      `
      const recipesExist = Number.parseInt(recipesCheck[0].count) > 0
      testResults.tests.push({
        name: "Recipes Table Check",
        status: recipesExist ? "success" : "error",
        message: recipesExist ? "Recipes table exists" : "Recipes table not found",
        data: { exists: recipesExist },
      })

      // If recipes table exists, get count
      if (recipesExist) {
        const recipeCount = await sql`SELECT COUNT(*) as total FROM recipes`
        testResults.tests.push({
          name: "Recipe Count",
          status: "info",
          message: `Found ${recipeCount[0].total} recipes in database`,
          data: { count: Number.parseInt(recipeCount[0].total) },
        })
      }
    } catch (tableError) {
      testResults.tests.push({
        name: "Recipes Table Check",
        status: "error",
        message: `Table check failed: ${tableError.message}`,
        error: tableError.message,
      })
    }

    // Test 5: Check database permissions
    try {
      // Try to create a temporary table to test write permissions
      await sql`CREATE TEMPORARY TABLE test_permissions (id INTEGER)`
      await sql`DROP TABLE test_permissions`
      testResults.tests.push({
        name: "Database Permissions",
        status: "success",
        message: "Database has read/write permissions",
      })
    } catch (permError) {
      testResults.tests.push({
        name: "Database Permissions",
        status: "warning",
        message: `Permission test failed: ${permError.message}`,
        error: permError.message,
      })
    }

    testResults.success = true
    return NextResponse.json(testResults)
  } catch (error) {
    console.error("❌ [DB-CONNECTION-TEST] Test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
