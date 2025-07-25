import { type NextRequest, NextResponse } from "next/server"
import { initializeDatabase, createUser, findUserByEmail } from "@/lib/neon"

export async function POST(request: NextRequest) {
  console.log("🔄 [INIT-DB] Database initialization request received")

  try {
    // Initialize database tables
    console.log("📊 [INIT-DB] Creating database tables...")
    await initializeDatabase()

    // Check if owner account already exists
    const existingOwner = await findUserByEmail("aaronhirshka@gmail.com")
    if (existingOwner) {
      console.log("✅ [INIT-DB] Owner account already exists")
      return NextResponse.json(
        {
          success: true,
          message: "Database already initialized with owner account",
          data: {
            owner: {
              id: existingOwner.id,
              username: existingOwner.username,
              email: existingOwner.email,
              role: existingOwner.role,
            },
          },
        },
        { status: 200 },
      )
    }

    // Create owner account
    console.log("👤 [INIT-DB] Creating owner account...")
    const owner = await createUser({
      username: "aaronhirshka",
      email: "aaronhirshka@gmail.com",
      password: "Morton2121",
      role: "admin",
      status: "active",
    })

    console.log("✅ [INIT-DB] Database initialization complete")

    return NextResponse.json(
      {
        success: true,
        message: "Database initialized successfully with owner account",
        data: {
          owner: {
            id: owner.id,
            username: owner.username,
            email: owner.email,
            role: owner.role,
          },
        },
      },
      { status: 201 },
    )
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
