import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, createOwnerAccount, testConnection } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Database initialization request received")

  try {
    // Test database connection first
    console.log("🔍 [API] Testing database connection...")
    const connectionTest = await testConnection()

    if (!connectionTest) {
      console.log("❌ [API] Database connection failed")
      return NextResponse.json(
        {
          success: false,
          message: "Database connection failed",
        },
        { status: 500 },
      )
    }

    console.log("✅ [API] Database connection successful")

    // Initialize database tables
    console.log("🔄 [API] Initializing database tables...")
    const initResult = await initializeDatabase()

    if (!initResult) {
      console.log("❌ [API] Database initialization failed")
      return NextResponse.json(
        {
          success: false,
          message: "Database initialization failed",
        },
        { status: 500 },
      )
    }

    console.log("✅ [API] Database tables initialized")

    // Create owner account
    console.log("🔄 [API] Creating owner account...")
    const ownerResult = await createOwnerAccount()

    if (!ownerResult.success) {
      console.log("❌ [API] Owner account creation failed:", ownerResult.error)
      return NextResponse.json(
        {
          success: false,
          message: "Owner account creation failed",
          error: ownerResult.error,
        },
        { status: 500 },
      )
    }

    console.log("✅ [API] Owner account created successfully")

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      owner: {
        username: ownerResult.user?.username,
        email: ownerResult.user?.email,
        role: ownerResult.user?.role,
      },
      credentials: ownerResult.credentials,
    })
  } catch (error) {
    console.error("❌ [API] Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  console.log("🔍 [API] Database status check")

  try {
    const connectionTest = await testConnection()

    return NextResponse.json({
      success: true,
      connected: connectionTest,
      message: connectionTest ? "Database connected" : "Database not connected",
    })
  } catch (error) {
    console.error("❌ [API] Database status check error:", error)
    return NextResponse.json(
      {
        success: false,
        connected: false,
        message: "Database status check failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
