import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  console.log("🔍 [DB-TEST] Starting database connection test")

  try {
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        databaseUrl: process.env.DATABASE_URL ? "✅ Present" : "❌ Missing",
        nodeEnv: process.env.NODE_ENV,
      },
      connection: null,
      tables: null,
      sampleData: null,
    }

    // Test 1: Basic connection
    try {
      console.log("🔍 [DB-TEST] Testing basic connection...")
      const result = await sql`SELECT NOW() as current_time, version() as db_version`
      testResults.connection = {
        success: true,
        currentTime: result[0].current_time,
        version: result[0].db_version,
      }
      console.log("✅ [DB-TEST] Basic connection successful")
    } catch (error) {
      testResults.connection = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.error("❌ [DB-TEST] Basic connection failed:", error)
    }

    // Test 2: Check tables exist
    try {
      console.log("🔍 [DB-TEST] Checking table existence...")
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `

      const tableNames = tables.map((t) => t.table_name)
      const requiredTables = ["users", "recipes", "ratings", "comments"]
      const missingTables = requiredTables.filter((table) => !tableNames.includes(table))

      testResults.tables = {
        success: missingTables.length === 0,
        existing: tableNames,
        required: requiredTables,
        missing: missingTables,
      }
      console.log("✅ [DB-TEST] Table check completed")
    } catch (error) {
      testResults.tables = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.error("❌ [DB-TEST] Table check failed:", error)
    }

    // Test 3: Sample data queries
    try {
      console.log("🔍 [DB-TEST] Testing sample data queries...")

      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`

      // Get a sample user if any exist
      const sampleUsers = await sql`SELECT id, username, role FROM users LIMIT 3`
      const sampleRecipes = await sql`SELECT id, title, author_username FROM recipes LIMIT 3`

      testResults.sampleData = {
        success: true,
        counts: {
          users: Number.parseInt(userCount[0].count),
          recipes: Number.parseInt(recipeCount[0].count),
        },
        samples: {
          users: sampleUsers,
          recipes: sampleRecipes,
        },
      }
      console.log("✅ [DB-TEST] Sample data queries successful")
    } catch (error) {
      testResults.sampleData = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      console.error("❌ [DB-TEST] Sample data queries failed:", error)
    }

    console.log("✅ [DB-TEST] Database test completed:", testResults)
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
