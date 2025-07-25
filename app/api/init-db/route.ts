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

    console.log("✅ [INIT-DB-API] Owner account created/verified successfully")

    return NextResponse.json({
      success: true,
      message: "Database initialized and owner account created successfully",
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
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  console.log("🔍 [INIT-DB-API] Database status check request received")

  try {
    // Check if tables exist
    const { sql } = await import("@/lib/neon")

    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sessions', 'recipes');
    `

    const existingTables = tablesCheck.map((row: any) => row.table_name)

    // Check if owner account exists
    let ownerExists = false
    let ownerInfo = null

    if (existingTables.includes("users")) {
      const ownerCheck = await sql`
        SELECT id, username, email, role, status, is_verified 
        FROM users 
        WHERE email = 'aaronhirshka@gmail.com'
        LIMIT 1;
      `

      if (ownerCheck.length > 0) {
        ownerExists = true
        ownerInfo = ownerCheck[0]
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        tables: {
          users: existingTables.includes("users"),
          sessions: existingTables.includes("sessions"),
          recipes: existingTables.includes("recipes"),
        },
        owner: {
          exists: ownerExists,
          info: ownerInfo,
        },
        status: existingTables.length === 3 && ownerExists ? "ready" : "needs_initialization",
      },
    })
  } catch (error) {
    console.error("❌ [INIT-DB-API] Database status check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database status check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
