import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        message: "DATABASE_URL environment variable is not configured",
        error: "Missing DATABASE_URL",
        database_url_configured: false,
      })
    }

    // Test the connection
    const sql = neon(process.env.DATABASE_URL)

    // Simple query to test connection
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      database_url_configured: true,
      details: {
        current_time: result[0].current_time,
        postgres_version: result[0].postgres_version,
        connection_test: "✅ Connected successfully",
      },
    })
  } catch (error) {
    console.error("Database connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        database_url_configured: !!process.env.DATABASE_URL,
        details: {
          error_type: error instanceof Error ? error.constructor.name : "Unknown",
          connection_test: "❌ Connection failed",
        },
      },
      { status: 500 },
    )
  }
}
