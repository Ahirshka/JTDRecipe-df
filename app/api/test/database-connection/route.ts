import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  console.log("🔍 [DB-TEST] Starting database connection test")

  try {
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        databaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
      connection: null,
      tables: [],
      tablesExist: false,
      recipeCount: 0,
      userCount: 0,
      sampleData: null,
    }

    // Test 1: Check environment variables
    if (!process.env.DATABASE_URL) {
      console.log("❌ [DB-TEST] DATABASE_URL not found")
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL environment variable not set",
        testResults,
      })
    }

    console.log("✅ [DB-TEST] DATABASE_URL found")

    // Test 2: Test basic connection
    try {
      const connectionTest = await sql`SELECT 1 as test`
      testResults.connection = {
        success: true,
        result: connectionTest,
      }
      console.log("✅ [DB-TEST] Database connection successful")
    } catch (connectionError) {
      console.log("❌ [DB-TEST] Database connection failed:", connectionError)
      testResults.connection = {
        success: false,
        error: connectionError instanceof Error ? connectionError.message : "Unknown connection error",
      }
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        testResults,
      })
    }

    // Test 3: Check if required tables exist
    try {
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'recipes', 'comments', 'ratings')
        ORDER BY table_name
      `

      testResults.tables = tableCheck.map((row: any) => row.table_name)
      testResults.tablesExist = testResults.tables.includes("users") && testResults.tables.includes("recipes")

      console.log("✅ [DB-TEST] Tables found:", testResults.tables)
    } catch (tableError) {
      console.log("❌ [DB-TEST] Table check failed:", tableError)
      testResults.tables = []
      testResults.tablesExist = false
    }

    // Test 4: Get record counts
    if (testResults.tablesExist) {
      try {
        // Get user count
        const userCountResult = await sql`SELECT COUNT(*) as count FROM users`
        testResults.userCount = Number.parseInt(userCountResult[0].count)

        // Get recipe count
        const recipeCountResult = await sql`SELECT COUNT(*) as count FROM recipes`
        testResults.recipeCount = Number.parseInt(recipeCountResult[0].count)

        console.log("✅ [DB-TEST] Record counts - Users:", testResults.userCount, "Recipes:", testResults.recipeCount)
      } catch (countError) {
        console.log("⚠️ [DB-TEST] Count queries failed:", countError)
      }
    }

    // Test 5: Get sample data
    if (testResults.recipeCount > 0) {
      try {
        const sampleRecipes = await sql`
          SELECT id, title, author_username, moderation_status, created_at
          FROM recipes 
          ORDER BY created_at DESC 
          LIMIT 5
        `
        testResults.sampleData = {
          recipes: sampleRecipes,
        }
        console.log("✅ [DB-TEST] Sample data retrieved")
      } catch (sampleError) {
        console.log("⚠️ [DB-TEST] Sample data query failed:", sampleError)
      }
    }

    console.log("✅ [DB-TEST] Database test completed successfully")
    return NextResponse.json(testResults)
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
