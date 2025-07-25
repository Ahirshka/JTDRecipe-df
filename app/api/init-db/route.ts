import { NextResponse } from "next/server"
import { initializeDatabase, createOwnerAccount } from "@/lib/neon"

export async function POST() {
  console.log("🔄 [INIT-DB-API] Database initialization request received")

  try {
    // Initialize database tables
    console.log("🔄 [INIT-DB-API] Initializing database tables...")
    const dbInitialized = await initializeDatabase()

    if (!dbInitialized) {
      console.error("❌ [INIT-DB-API] Database initialization failed")
      return NextResponse.json(
        {
          success: false,
          error: "Database initialization failed",
          details: "Failed to create database tables",
        },
        { status: 500 },
      )
    }

    console.log("✅ [INIT-DB-API] Database tables initialized successfully")

    // Create owner account
    console.log("🔄 [INIT-DB-API] Creating owner account...")
    const ownerResult = await createOwnerAccount()

    if (!ownerResult.success) {
      console.error("❌ [INIT-DB-API] Owner account creation failed:", ownerResult.error)
      return NextResponse.json(
        {
          success: false,
          error: "Owner account creation failed",
          details: ownerResult.error,
        },
        { status: 500 },
      )
    }

    console.log("✅ [INIT-DB-API] Owner account created successfully:", ownerResult.user)

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      data: {
        database: "initialized",
        owner: ownerResult.user,
      },
    })
  } catch (error) {
    console.error("❌ [INIT-DB-API] Database initialization error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  console.log("🔍 [INIT-DB-API] Database status check request received")

  try {
    // Import sql directly to check database status
    const { sql } = await import("@/lib/neon")

    // Check if users table exists
    const usersTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `
    const usersTableExists = usersTableCheck[0].exists

    // Check if sessions table exists
    const sessionsTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
      );
    `
    const sessionsTableExists = sessionsTableCheck[0].exists

    // Check if recipes table exists
    const recipesTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'recipes'
      );
    `
    const recipesTableExists = recipesTableCheck[0].exists

    // Check if owner account exists
    let ownerExists = false
    let ownerInfo = null

    if (usersTableExists) {
      const ownerCheck = await sql`
        SELECT id, username, email, role, status, is_verified, created_at 
        FROM users 
        WHERE email = 'aaronhirshka@gmail.com'
        LIMIT 1;
      `
      ownerExists = ownerCheck.length > 0
      if (ownerExists) {
        ownerInfo = ownerCheck[0]
      }
    }

    // Get user count
    let userCount = 0
    if (usersTableExists) {
      const userCountResult = await sql`SELECT COUNT(*) as count FROM users;`
      userCount = Number.parseInt(userCountResult[0].count)
    }

    // Get recipe count
    let recipeCount = 0
    if (recipesTableExists) {
      const recipeCountResult = await sql`SELECT COUNT(*) as count FROM recipes;`
      recipeCount = Number.parseInt(recipeCountResult[0].count)
    }

    console.log("✅ [INIT-DB-API] Database status check completed")

    return NextResponse.json({
      success: true,
      data: {
        tables: {
          users: usersTableExists,
          sessions: sessionsTableExists,
          recipes: recipesTableExists,
        },
        owner: {
          exists: ownerExists,
          info: ownerInfo,
        },
        counts: {
          users: userCount,
          recipes: recipeCount,
        },
        database_ready: usersTableExists && sessionsTableExists && recipesTableExists && ownerExists,
      },
    })
  } catch (error) {
    console.error("❌ [INIT-DB-API] Database status check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database status check failed",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
