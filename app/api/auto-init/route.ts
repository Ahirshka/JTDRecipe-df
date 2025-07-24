import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, checkDatabaseStatus } from "@/lib/auto-init"

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Auto-initialization requested...")

    // First check if already initialized
    const status = await checkDatabaseStatus()

    if (status.initialized) {
      console.log("✅ Database already initialized")
      return NextResponse.json({
        success: true,
        message: "Database already initialized",
        data: status.data,
      })
    }

    // Initialize the database
    const result = await initializeDatabase()

    return NextResponse.json(result)
  } catch (error) {
    console.error("❌ Auto-initialization failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Auto-initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const status = await checkDatabaseStatus()
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      {
        initialized: false,
        message: "Failed to check database status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
