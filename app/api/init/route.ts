import { NextResponse } from "next/server"
import { initializeAuthSystem } from "@/lib/auth-system"

export async function GET() {
  console.log("🔍 [INIT-API] System status check requested")

  try {
    return NextResponse.json({
      success: true,
      message: "System is initialized",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [INIT-API] Error checking system status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System check failed",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  console.log("🚀 [INIT-API] System initialization requested")

  try {
    const initialized = await initializeAuthSystem()

    if (initialized) {
      console.log("✅ [INIT-API] System initialized successfully")
      return NextResponse.json({
        success: true,
        message: "System initialized successfully",
        timestamp: new Date().toISOString(),
      })
    } else {
      console.log("❌ [INIT-API] System initialization failed")
      return NextResponse.json(
        {
          success: false,
          error: "System initialization failed",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [INIT-API] Error initializing system:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System initialization error",
      },
      { status: 500 },
    )
  }
}
