import { NextResponse } from "next/server"
import { initializeDatabase, createUser } from "@/lib/neon"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  try {
    console.log("🔍 [INIT-DB] Starting database initialization")

    // Initialize database tables
    const dbInitialized = await initializeDatabase()
    if (!dbInitialized) {
      throw new Error("Failed to initialize database")
    }

    console.log("✅ [INIT-DB] Database tables created successfully")

    // Create owner account
    try {
      const ownerPassword = "Morton2121"
      console.log("🔍 [INIT-DB] Creating owner account")

      const ownerUser = await createUser({
        username: "owner",
        email: "owner@recipe-site.com",
        password: ownerPassword,
        role: "admin",
        status: "active",
      })

      console.log("✅ [INIT-DB] Owner account created:", ownerUser.id)

      return NextResponse.json({
        success: true,
        message: "Database initialized successfully",
        owner: {
          id: ownerUser.id,
          username: ownerUser.username,
          email: ownerUser.email,
          role: ownerUser.role,
        },
        credentials: {
          email: "owner@recipe-site.com",
          password: ownerPassword,
        },
      })
    } catch (userError) {
      console.log("⚠️ [INIT-DB] Owner account might already exist:", userError)

      return NextResponse.json({
        success: true,
        message: "Database initialized (owner account may already exist)",
        credentials: {
          email: "owner@recipe-site.com",
          password: "Morton2121",
        },
      })
    }
  } catch (error) {
    console.error("❌ [INIT-DB] Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to initialize database",
    endpoints: {
      initialize: "POST /api/init-db",
    },
  })
}
