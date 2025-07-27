import { NextResponse } from "next/server"
import { initializeAuthSystem } from "@/lib/auth-system"

export async function POST() {
  console.log("🔄 [INIT-API] System initialization request received")

  try {
    const result = await initializeAuthSystem()

    console.log("🔍 [INIT-API] Initialization result:", {
      success: result.success,
      message: result.message,
    })

    if (result.success) {
      console.log("✅ [INIT-API] System initialized successfully")

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      console.log("❌ [INIT-API] System initialization failed:", result.message)

      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [INIT-API] Initialization error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "System initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  console.log("🔍 [INIT-API] System status check request received")

  try {
    // Check if system is initialized by looking for owner account
    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const ownerExists = await sql`
      SELECT id, username FROM users WHERE role = 'owner' LIMIT 1
    `

    const isInitialized = ownerExists.length > 0

    console.log("🔍 [INIT-API] System status:", {
      isInitialized,
      ownerExists: ownerExists.length > 0,
    })

    return NextResponse.json({
      success: true,
      initialized: isInitialized,
      owner: ownerExists.length > 0 ? ownerExists[0] : null,
    })
  } catch (error) {
    console.error("❌ [INIT-API] Status check error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Status check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
