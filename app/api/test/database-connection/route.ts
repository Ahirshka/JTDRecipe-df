import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        message: "DATABASE_URL not configured",
        error: "Missing DATABASE_URL environment variable",
        details: "Please set your DATABASE_URL in Vercel environment variables",
        fallback: "Using mock data instead",
        environment_check: {
          database_url: false,
          node_env: process.env.NODE_ENV || "development",
        },
      })
    }

    // Test database connection
    const sql = neon(process.env.DATABASE_URL)

    // Simple query to test connection
    const result = await sql`SELECT NOW() as current_time, version() as database_version`

    if (result && result[0]) {
      return NextResponse.json({
        success: true,
        message: "Database connection successful",
        connection: {
          current_time: result[0].current_time,
          database_version: result[0].database_version,
          database_url_configured: true,
        },
        environment_check: {
          database_url: true,
          node_env: process.env.NODE_ENV || "development",
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Database query failed",
        error: "No result returned from database",
        fallback: "Using mock data instead",
      })
    }
  } catch (error) {
    console.error("Database connection test failed:", error)

    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown database error",
      details: error instanceof Error ? error.stack : "No additional details",
      fallback: "Using mock data instead",
      environment_check: {
        database_url: !!process.env.DATABASE_URL,
        node_env: process.env.NODE_ENV || "development",
      },
    })
  }
}
