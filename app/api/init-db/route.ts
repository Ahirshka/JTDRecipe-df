import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, createUser, findUserByEmail } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [INIT-DB] Database initialization request received")

  try {
    // Initialize database tables
    console.log("📋 [INIT-DB] Creating database tables...")
    await initializeDatabase()

    // Check if owner account already exists
    const existingOwner = await findUserByEmail("aaronhirshka@gmail.com")

    if (existingOwner) {
      console.log("✅ [INIT-DB] Owner account already exists")
      return NextResponse.json({
        success: true,
        message: "Database initialized successfully",
        details: "Owner account already exists",
        owner: {
          email: "aaronhirshka@gmail.com",
          username: existingOwner.username,
          role: existingOwner.role,
        },
      })
    }

    // Create owner account
    console.log("👤 [INIT-DB] Creating owner account...")
    const owner = await createUser({
      username: "aaron_owner",
      email: "aaronhirshka@gmail.com",
      password: "Morton2121",
      role: "admin",
      status: "active",
    })

    console.log("✅ [INIT-DB] Database initialization completed successfully")

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      details: "All tables created and owner account set up",
      owner: {
        email: "aaronhirshka@gmail.com",
        username: owner.username,
        role: owner.role,
        id: owner.id,
      },
    })
  } catch (error) {
    console.error("❌ [INIT-DB] Database initialization failed:", error)

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
