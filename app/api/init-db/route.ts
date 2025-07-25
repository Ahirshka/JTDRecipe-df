import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, createOwnerAccount } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [INIT-DB-API] Database initialization request received")

  try {
    // Initialize database
    await initializeDatabase()

    // Create owner account
    const ownerResult = await createOwnerAccount()

    console.log("✅ [INIT-DB-API] Database initialization complete")

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      owner: ownerResult,
    })
  } catch (error) {
    console.error("❌ [INIT-DB-API] Database initialization error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database initialization failed",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}
