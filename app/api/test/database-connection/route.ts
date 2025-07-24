import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("Testing database connection...")

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL not configured",
        message: "Please set your DATABASE_URL environment variable",
        fallback: "Using mock data instead",
        environment_check: {
          database_url: !!process.env.DATABASE_URL,
          node_env: process.env.NODE_ENV,
        },
      })
    }

    // Test database connection
    if (sql) {
      try {
        const result = await sql`SELECT NOW() as current_time, version() as db_version`

        return NextResponse.json({
          success: true,
          message: "Database connection successful!",
          connection: {
            current_time: result[0].current_time,
            database_version: result[0].db_version,
            database_url_configured: true,
          },
        })
      } catch (dbError) {
        console.error("Database query failed:", dbError)
        return NextResponse.json(
          {
            success: false,
            error: "Database query failed",
            details: dbError instanceof Error ? dbError.message : "Unknown database error",
            fallback: "Using mock data instead",
          },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json({
        success: false,
        error: "Database connection failed to initialize",
        message: "SQL client is null - check DATABASE_URL format",
        fallback: "Using mock data instead",
      })
    }
  } catch (error) {
    console.error("Database connection test failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: "Using mock data instead",
      },
      { status: 500 },
    )
  }
}
