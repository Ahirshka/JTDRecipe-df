import { NextResponse } from "next/server"
import { initializeDatabase, reinitializeDatabase, createOwnerAccount, findUserByEmail } from "@/lib/neon"
import { sql } from "@/lib/neon"

// GET - Check database status
export async function GET() {
  console.log("🔍 [INIT-DB] Checking database status...")

  try {
    // Check if tables exist
    const tablesCheck = await Promise.all([
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');`,
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sessions');`,
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recipes');`,
    ])

    const tables = {
      users: tablesCheck[0][0].exists,
      sessions: tablesCheck[1][0].exists,
      recipes: tablesCheck[2][0].exists,
    }

    // Check if owner account exists
    const ownerUser = await findUserByEmail("admin@recipesite.com")

    // Get counts
    const counts = { users: 0, recipes: 0 }
    try {
      if (tables.users) {
        const userCount = await sql`SELECT COUNT(*) as count FROM users;`
        counts.users = Number.parseInt(userCount[0].count)
      }
      if (tables.recipes) {
        const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes;`
        counts.recipes = Number.parseInt(recipeCount[0].count)
      }
    } catch (countError) {
      console.log("ℹ️ [INIT-DB] Could not get counts:", countError)
    }

    const status = {
      tables,
      owner: {
        exists: !!ownerUser,
        info: ownerUser
          ? {
              id: ownerUser.id,
              username: ownerUser.username,
              email: ownerUser.email,
              role: ownerUser.role,
              status: ownerUser.status,
              is_verified: ownerUser.is_verified,
              created_at: ownerUser.created_at,
            }
          : null,
      },
      counts,
      database_ready: tables.users && tables.sessions && tables.recipes && !!ownerUser,
    }

    console.log("✅ [INIT-DB] Database status check complete:", status)

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error("❌ [INIT-DB] Status check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check database status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Initialize or reinitialize database
export async function POST(request: Request) {
  console.log("🔄 [INIT-DB] Starting database initialization...")

  try {
    const body = await request.json().catch(() => ({}))
    const { reinitialize = false, ownerData } = body

    let dbInitialized: boolean

    if (reinitialize) {
      console.log("🔄 [INIT-DB] Reinitializing database (dropping and recreating)...")
      dbInitialized = await reinitializeDatabase()
    } else {
      console.log("📋 [INIT-DB] Creating database tables...")
      dbInitialized = await initializeDatabase()
    }

    if (!dbInitialized) {
      throw new Error("Database initialization failed")
    }

    console.log("✅ [INIT-DB] Database tables created successfully")

    // Create owner account with custom data if provided
    console.log("👤 [INIT-DB] Creating owner account...")
    const ownerResult = await createOwnerAccount(ownerData)

    if (!ownerResult.success) {
      throw new Error(ownerResult.error || "Owner account creation failed")
    }

    console.log("✅ [INIT-DB] Owner account created successfully")

    return NextResponse.json({
      success: true,
      message: reinitialize ? "Database reinitialized successfully" : "Database initialized successfully",
      data: {
        database: "Neon PostgreSQL",
        owner: ownerResult.user,
        credentials: ownerResult.credentials,
        reinitialized: reinitialize,
      },
    })
  } catch (error) {
    console.error("❌ [INIT-DB] Initialization error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
