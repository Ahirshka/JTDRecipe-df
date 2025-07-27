import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  console.log("🔍 [DB-TEST] Starting database connection test")

  try {
    // Test 1: Basic connection
    console.log("🔍 [DB-TEST] Testing basic database connection...")
    await sql`SELECT 1 as test`
    console.log("✅ [DB-TEST] Basic connection successful")

    // Test 2: Check environment variables
    const hasDbUrl = !!process.env.DATABASE_URL
    console.log("🔍 [DB-TEST] DATABASE_URL present:", hasDbUrl)

    // Test 3: Check required tables exist
    console.log("🔍 [DB-TEST] Checking required tables...")
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'recipes', 'ratings', 'comments')
      ORDER BY table_name
    `

    const existingTables = tableCheck.map((row) => row.table_name)
    const requiredTables = ["users", "recipes", "ratings", "comments"]
    const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

    console.log("✅ [DB-TEST] Existing tables:", existingTables)
    if (missingTables.length > 0) {
      console.log("⚠️ [DB-TEST] Missing tables:", missingTables)
    }

    // Test 4: Get sample data counts
    console.log("🔍 [DB-TEST] Getting data counts...")
    let userCount = 0
    let recipeCount = 0
    let sampleUsers = []
    let sampleRecipes = []

    try {
      if (existingTables.includes("users")) {
        const userCountResult = await sql`SELECT COUNT(*) as count FROM users`
        userCount = Number.parseInt(userCountResult[0].count)

        const userSample = await sql`
          SELECT id, username, email, role, status, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 3
        `
        sampleUsers = userSample
      }

      if (existingTables.includes("recipes")) {
        const recipeCountResult = await sql`SELECT COUNT(*) as count FROM recipes`
        recipeCount = Number.parseInt(recipeCountResult[0].count)

        const recipeSample = await sql`
          SELECT id, title, author_username, moderation_status, created_at 
          FROM recipes 
          ORDER BY created_at DESC 
          LIMIT 5
        `
        sampleRecipes = recipeSample
      }
    } catch (dataError) {
      console.log("⚠️ [DB-TEST] Error getting sample data:", dataError)
    }

    // Test 5: Test write permissions
    console.log("🔍 [DB-TEST] Testing write permissions...")
    let canWrite = false
    try {
      // Try to create a temporary table and drop it
      await sql`
        CREATE TEMPORARY TABLE test_write_permissions (
          id SERIAL PRIMARY KEY,
          test_data TEXT
        )
      `
      await sql`DROP TABLE test_write_permissions`
      canWrite = true
      console.log("✅ [DB-TEST] Write permissions confirmed")
    } catch (writeError) {
      console.log("⚠️ [DB-TEST] Write permission test failed:", writeError)
    }

    const result = {
      success: true,
      message: "Database connection successful",
      data: {
        connection: {
          status: "connected",
          hasDbUrl,
          canWrite,
        },
        tables: {
          existing: existingTables,
          missing: missingTables,
          allRequired: missingTables.length === 0,
        },
        counts: {
          userCount,
          recipeCount,
        },
        samples: {
          users: sampleUsers,
          recipes: sampleRecipes,
        },
        timestamp: new Date().toISOString(),
      },
    }

    console.log("✅ [DB-TEST] Database test completed successfully")
    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ [DB-TEST] Database test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        data: {
          connection: {
            status: "failed",
            hasDbUrl: !!process.env.DATABASE_URL,
          },
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}
