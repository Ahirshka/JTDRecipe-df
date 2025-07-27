import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  console.log("🔍 [DB-TEST] Starting database connection test")

  try {
    const testResult = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        databaseUrl: process.env.DATABASE_URL ? "Present" : "Missing",
        nodeEnv: process.env.NODE_ENV,
      },
      connection: null,
      tables: [],
      tablesExist: false,
      userCount: 0,
      recipeCount: 0,
      sampleData: null,
    }

    // Test 1: Basic connection
    try {
      await sql`SELECT 1 as test`
      testResult.connection = { success: true, message: "Database connection successful" }
      console.log("✅ [DB-TEST] Database connection successful")
    } catch (error) {
      testResult.connection = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown connection error",
      }
      testResult.success = false
      console.error("❌ [DB-TEST] Database connection failed:", error)
      return NextResponse.json(testResult, { status: 500 })
    }

    // Test 2: Check if required tables exist
    try {
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'recipes', 'comments', 'ratings')
        ORDER BY table_name
      `

      testResult.tables = tableCheck.map((row: any) => row.table_name)
      testResult.tablesExist = testResult.tables.includes("users") && testResult.tables.includes("recipes")

      console.log("✅ [DB-TEST] Tables found:", testResult.tables)
    } catch (error) {
      console.error("❌ [DB-TEST] Table check failed:", error)
      testResult.tables = []
      testResult.tablesExist = false
    }

    // Test 3: Get counts if tables exist
    if (testResult.tablesExist) {
      try {
        // Get user count
        const userCountResult = await sql`SELECT COUNT(*) as count FROM users`
        testResult.userCount = Number.parseInt(userCountResult[0].count)

        // Get recipe count
        const recipeCountResult = await sql`SELECT COUNT(*) as count FROM recipes`
        testResult.recipeCount = Number.parseInt(recipeCountResult[0].count)

        console.log(`✅ [DB-TEST] Data counts - Users: ${testResult.userCount}, Recipes: ${testResult.recipeCount}`)
      } catch (error) {
        console.error("❌ [DB-TEST] Count queries failed:", error)
      }

      // Test 4: Get sample data
      try {
        const sampleUsers = await sql`
          SELECT id, username, email, role, status, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 3
        `

        const sampleRecipes = await sql`
          SELECT id, title, author_username, moderation_status, created_at 
          FROM recipes 
          ORDER BY created_at DESC 
          LIMIT 3
        `

        testResult.sampleData = {
          users: sampleUsers.map((user: any) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            created_at: user.created_at,
          })),
          recipes: sampleRecipes.map((recipe: any) => ({
            id: recipe.id,
            title: recipe.title,
            author_username: recipe.author_username,
            moderation_status: recipe.moderation_status,
            created_at: recipe.created_at,
          })),
        }

        console.log("✅ [DB-TEST] Sample data retrieved successfully")
      } catch (error) {
        console.error("❌ [DB-TEST] Sample data query failed:", error)
        testResult.sampleData = { error: "Failed to retrieve sample data" }
      }
    }

    console.log("✅ [DB-TEST] Database test completed successfully")
    return NextResponse.json(testResult)
  } catch (error) {
    console.error("❌ [DB-TEST] Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
