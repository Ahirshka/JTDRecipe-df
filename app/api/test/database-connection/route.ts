import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  console.log("🔍 [DB-TEST] Starting database connection test")

  try {
    // Step 1: Test basic connection
    console.log("🔍 [DB-TEST] Step 1: Testing basic connection...")
    const connectionTest = await sql`SELECT NOW() as current_time, version() as db_version`
    console.log("✅ [DB-TEST] Basic connection successful")

    // Step 2: Check required tables exist
    console.log("🔍 [DB-TEST] Step 2: Checking required tables...")
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

    console.log("📋 [DB-TEST] Existing tables:", existingTables)
    console.log("📋 [DB-TEST] Missing tables:", missingTables)

    // Step 3: Check users table structure
    console.log("🔍 [DB-TEST] Step 3: Checking users table structure...")
    let usersTableStructure = []
    try {
      usersTableStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      console.log("✅ [DB-TEST] Users table structure retrieved")
    } catch (error) {
      console.log("❌ [DB-TEST] Users table structure check failed:", error)
    }

    // Step 4: Check recipes table structure
    console.log("🔍 [DB-TEST] Step 4: Checking recipes table structure...")
    let recipesTableStructure = []
    try {
      recipesTableStructure = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      console.log("✅ [DB-TEST] Recipes table structure retrieved")
    } catch (error) {
      console.log("❌ [DB-TEST] Recipes table structure check failed:", error)
    }

    // Step 5: Count records in each table
    console.log("🔍 [DB-TEST] Step 5: Counting records...")
    const counts: any = {}

    try {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`
      counts.users = Number.parseInt(userCount[0].count)
      console.log("📊 [DB-TEST] Users count:", counts.users)
    } catch (error) {
      console.log("❌ [DB-TEST] Users count failed:", error)
      counts.users = "error"
    }

    try {
      const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
      counts.recipes = Number.parseInt(recipeCount[0].count)
      console.log("📊 [DB-TEST] Recipes count:", counts.recipes)
    } catch (error) {
      console.log("❌ [DB-TEST] Recipes count failed:", error)
      counts.recipes = "error"
    }

    try {
      const ratingCount = await sql`SELECT COUNT(*) as count FROM ratings`
      counts.ratings = Number.parseInt(ratingCount[0].count)
      console.log("📊 [DB-TEST] Ratings count:", counts.ratings)
    } catch (error) {
      console.log("❌ [DB-TEST] Ratings count failed:", error)
      counts.ratings = "error"
    }

    try {
      const commentCount = await sql`SELECT COUNT(*) as count FROM comments`
      counts.comments = Number.parseInt(commentCount[0].count)
      console.log("📊 [DB-TEST] Comments count:", counts.comments)
    } catch (error) {
      console.log("❌ [DB-TEST] Comments count failed:", error)
      counts.comments = "error"
    }

    // Step 6: Check for admin users
    console.log("🔍 [DB-TEST] Step 6: Checking for admin users...")
    let adminUsers = []
    try {
      adminUsers = await sql`
        SELECT id, username, email, role, status, is_verified, created_at
        FROM users 
        WHERE role IN ('admin', 'owner', 'moderator')
        ORDER BY 
          CASE role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'moderator' THEN 3 
            ELSE 4 
          END,
          created_at
      `
      console.log("👑 [DB-TEST] Admin users found:", adminUsers.length)
      adminUsers.forEach((user) => {
        console.log(`  - ${user.username} (${user.role}) - ${user.status}`)
      })
    } catch (error) {
      console.log("❌ [DB-TEST] Admin users check failed:", error)
    }

    // Step 7: Check sample recipes
    console.log("🔍 [DB-TEST] Step 7: Checking sample recipes...")
    let sampleRecipes = []
    try {
      sampleRecipes = await sql`
        SELECT id, title, author_username, moderation_status, created_at
        FROM recipes 
        ORDER BY created_at DESC 
        LIMIT 5
      `
      console.log("🍳 [DB-TEST] Sample recipes found:", sampleRecipes.length)
      sampleRecipes.forEach((recipe) => {
        console.log(`  - ${recipe.title} by ${recipe.author_username} (${recipe.moderation_status})`)
      })
    } catch (error) {
      console.log("❌ [DB-TEST] Sample recipes check failed:", error)
    }

    // Step 8: Test foreign key constraints
    console.log("🔍 [DB-TEST] Step 8: Checking foreign key constraints...")
    let foreignKeys = []
    try {
      foreignKeys = await sql`
        SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name, kcu.column_name
      `
      console.log("🔗 [DB-TEST] Foreign key constraints found:", foreignKeys.length)
    } catch (error) {
      console.log("❌ [DB-TEST] Foreign key constraints check failed:", error)
    }

    // Compile results
    const testResults = {
      success: true,
      message: "Database connection and structure tests completed",
      data: {
        connection: {
          success: true,
          timestamp: connectionTest[0].current_time,
          version: connectionTest[0].db_version,
        },
        tables: {
          existing: existingTables,
          missing: missingTables,
          required: requiredTables,
          allPresent: missingTables.length === 0,
        },
        structure: {
          users: usersTableStructure,
          recipes: recipesTableStructure,
        },
        counts,
        adminUsers: adminUsers.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
          is_verified: user.is_verified,
        })),
        sampleRecipes: sampleRecipes.map((recipe) => ({
          id: recipe.id,
          title: recipe.title,
          author: recipe.author_username,
          status: recipe.moderation_status,
        })),
        foreignKeys,
      },
      timestamp: new Date().toISOString(),
    }

    console.log("✅ [DB-TEST] Database test completed successfully")
    return NextResponse.json(testResults)
  } catch (error) {
    console.error("❌ [DB-TEST] Database test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
