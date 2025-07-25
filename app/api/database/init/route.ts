import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, createOwnerAccount, reinitializeDatabase, testConnection } from "@/lib/neon"

export async function GET() {
  try {
    console.log("🔍 [DATABASE-INIT] Checking database status...")

    // Test database connection
    const connected = await testConnection()
    console.log("🔍 [DATABASE-INIT] Connection test:", connected ? "PASSED" : "FAILED")

    if (!connected) {
      return NextResponse.json({
        success: false,
        connected: false,
        tablesExist: false,
        ownerExists: false,
        error: "Database connection failed",
      })
    }

    // Check if tables exist (simplified check)
    let tablesExist = false
    try {
      const { sql } = await import("@/lib/neon")
      const result = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'sessions', 'recipes')
      `
      tablesExist = result.length >= 3
      console.log("🔍 [DATABASE-INIT] Tables exist:", tablesExist, `(found ${result.length}/3)`)
    } catch (error) {
      console.log("🔍 [DATABASE-INIT] Error checking tables:", error)
      tablesExist = false
    }

    // Check if owner exists
    let ownerExists = false
    if (tablesExist) {
      try {
        const { sql } = await import("@/lib/neon")
        const result = await sql`
          SELECT id FROM users 
          WHERE role = 'owner' 
          LIMIT 1
        `
        ownerExists = result.length > 0
        console.log("🔍 [DATABASE-INIT] Owner exists:", ownerExists)
      } catch (error) {
        console.log("🔍 [DATABASE-INIT] Error checking owner:", error)
        ownerExists = false
      }
    }

    return NextResponse.json({
      success: true,
      connected,
      tablesExist,
      ownerExists,
    })
  } catch (error) {
    console.error("❌ [DATABASE-INIT] Status check error:", error)
    return NextResponse.json({
      success: false,
      connected: false,
      tablesExist: false,
      ownerExists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ownerData } = await request.json()
    console.log("🔄 [DATABASE-INIT] Action requested:", action)

    switch (action) {
      case "initialize": {
        console.log("🔄 [DATABASE-INIT] Initializing database...")

        // Initialize database tables
        const tablesCreated = await initializeDatabase()
        if (!tablesCreated) {
          throw new Error("Failed to create database tables")
        }

        // Create owner account
        const ownerResult = await createOwnerAccount(ownerData)
        if (!ownerResult.success) {
          throw new Error(ownerResult.error || "Failed to create owner account")
        }

        return NextResponse.json({
          success: true,
          message: "Database initialized successfully",
          owner: ownerResult.user,
        })
      }

      case "reset": {
        console.log("🔄 [DATABASE-INIT] Resetting database...")

        // Reinitialize (drop and recreate)
        const resetSuccess = await reinitializeDatabase()
        if (!resetSuccess) {
          throw new Error("Failed to reset database")
        }

        // Create owner account
        const ownerResult = await createOwnerAccount(ownerData)
        if (!ownerResult.success) {
          throw new Error(ownerResult.error || "Failed to create owner account")
        }

        return NextResponse.json({
          success: true,
          message: "Database reset successfully",
          owner: ownerResult.user,
        })
      }

      case "createOwner": {
        console.log("🔄 [DATABASE-INIT] Creating owner account...")

        const ownerResult = await createOwnerAccount(ownerData)
        if (!ownerResult.success) {
          throw new Error(ownerResult.error || "Failed to create owner account")
        }

        return NextResponse.json({
          success: true,
          message: "Owner account created successfully",
          owner: ownerResult.user,
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action",
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error("❌ [DATABASE-INIT] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
