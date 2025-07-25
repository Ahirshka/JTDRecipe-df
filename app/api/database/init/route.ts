import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, resetDatabase, createDefaultAdmin, getDatabaseStatus } from "@/lib/database-init"

export async function GET(request: NextRequest) {
  console.log("🔍 [API-DB-INIT] Database status request")

  try {
    const status = await getDatabaseStatus()

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("❌ [API-DB-INIT] Error getting database status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get database status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("🔄 [API-DB-INIT] Database initialization request")

  try {
    const body = await request.json()
    const { action, adminUsername, adminEmail, adminPassword } = body

    if (action === "reset") {
      console.log("🗑️ [API-DB-INIT] Resetting database...")
      const resetResult = await resetDatabase()

      if (!resetResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: resetResult.message,
          },
          { status: 500 },
        )
      }

      // Create default admin after reset
      const adminResult = await createDefaultAdmin(
        adminUsername || "aaronhirshka",
        adminEmail || "aaronhirshka@gmail.com",
        adminPassword || "Morton2121",
      )

      return NextResponse.json({
        success: true,
        message: "Database reset and admin created successfully",
        admin: adminResult.credentials,
      })
    } else {
      // Initialize database
      console.log("🔄 [API-DB-INIT] Initializing database...")
      const initResult = await initializeDatabase()

      if (!initResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: initResult.message,
          },
          { status: 500 },
        )
      }

      // Create default admin
      const adminResult = await createDefaultAdmin(
        adminUsername || "aaronhirshka",
        adminEmail || "aaronhirshka@gmail.com",
        adminPassword || "Morton2121",
      )

      return NextResponse.json({
        success: true,
        message: "Database initialized and admin created successfully",
        admin: adminResult.credentials,
      })
    }
  } catch (error) {
    console.error("❌ [API-DB-INIT] Server error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
