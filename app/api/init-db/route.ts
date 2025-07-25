import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, findUserByEmail, createUser } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [INIT-DB] Starting database initialization")

    // Initialize database tables
    await initializeDatabase()
    console.log("✅ [INIT-DB] Database tables created")

    // Check if owner account already exists
    const ownerEmail = "aaronhirshka@gmail.com"
    const ownerPassword = "Morton2121"

    let ownerExists = false
    let ownerCreated = false
    let owner = await findUserByEmail(ownerEmail)

    if (owner) {
      console.log("✅ [INIT-DB] Owner account already exists")
      ownerExists = true
    } else {
      console.log("🔄 [INIT-DB] Creating owner account")

      // Create owner account
      owner = await createUser({
        username: "owner",
        email: ownerEmail,
        password: ownerPassword,
        role: "admin",
        status: "active",
      })

      console.log("✅ [INIT-DB] Owner account created:", owner.id)
      ownerCreated = true
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      ownerExists,
      ownerCreated,
      credentials: {
        email: ownerEmail,
        password: ownerPassword,
      },
      owner: {
        id: owner.id,
        username: owner.username,
        email: owner.email,
        role: owner.role,
      },
    })
  } catch (error) {
    console.error("❌ [INIT-DB] Database initialization failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Database initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : "No details available",
      },
      { status: 500 },
    )
  }
}
