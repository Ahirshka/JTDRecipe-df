import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    console.log("Initializing database and owner account...")

    const success = await initializeDatabase()

    return NextResponse.json({
      success,
      message: success ? "Database initialized successfully" : "Database initialization failed",
      owner: {
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
      },
      database_url_configured: !!process.env.DATABASE_URL,
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
        database_url_configured: !!process.env.DATABASE_URL,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Database initialization endpoint",
    instructions: "Send a POST request to initialize the database and create the owner account",
    owner_credentials: {
      email: "aaronhirshka@gmail.com",
      password: "Morton2121",
      role: "owner",
    },
    database_url_configured: !!process.env.DATABASE_URL,
  })
}
