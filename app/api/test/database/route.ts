import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check if DATABASE_URL is configured
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        message: "Database URL not configured",
        details: "DATABASE_URL environment variable is missing",
        error: "Missing environment variable: DATABASE_URL",
        duration: Date.now() - startTime,
      })
    }

    // Validate DATABASE_URL format
    if (!databaseUrl.startsWith("postgresql://")) {
      return NextResponse.json({
        success: false,
        message: "Invalid database URL format",
        details: "DATABASE_URL must be a valid PostgreSQL connection string",
        error: "Invalid DATABASE_URL format - must start with postgresql://",
        duration: Date.now() - startTime,
      })
    }

    // Test database connection
    const sql = neon(databaseUrl)

    // Simple connection test
    const result = await sql`SELECT 1 as test, NOW() as timestamp`

    if (result && result.length > 0) {
      // Test if our main tables exist
      try {
        const tableCheck = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'recipes', 'user_sessions', 'email_tokens')
        `

        const existingTables = tableCheck.map((row) => row.table_name)
        const requiredTables = ["users", "recipes", "user_sessions", "email_tokens"]
        const missingTables = requiredTables.filter((table) => !existingTables.includes(table))

        if (missingTables.length > 0) {
          return NextResponse.json({
            success: false,
            message: "Database connected but tables missing",
            details: `Missing tables: ${missingTables.join(", ")}. Run database migration scripts.`,
            error: `Missing required tables: ${missingTables.join(", ")}`,
            duration: Date.now() - startTime,
          })
        }

        return NextResponse.json({
          success: true,
          message: "Database connection successful",
          details: `Connected to Neon PostgreSQL. All required tables present: ${existingTables.join(", ")}`,
          duration: Date.now() - startTime,
        })
      } catch (tableError) {
        return NextResponse.json({
          success: true,
          message: "Database connected (tables not checked)",
          details: "Connection successful but unable to verify table structure",
          duration: Date.now() - startTime,
        })
      }
    } else {
      return NextResponse.json({
        success: false,
        message: "Database query failed",
        details: "Connection established but test query returned no results",
        error: "Test query failed",
        duration: Date.now() - startTime,
      })
    }
  } catch (error) {
    console.error("Database test error:", error)

    let errorMessage = "Unknown database error"
    let errorDetails = "Unable to connect to database"

    if (error instanceof Error) {
      errorMessage = error.message

      // Provide specific error guidance
      if (error.message.includes("authentication failed")) {
        errorDetails = "Database authentication failed. Check your DATABASE_URL credentials."
      } else if (error.message.includes("connection refused")) {
        errorDetails = "Database connection refused. Check if your Neon database is active."
      } else if (error.message.includes("timeout")) {
        errorDetails = "Database connection timeout. Check your network connection and database availability."
      } else if (error.message.includes("SSL")) {
        errorDetails = "SSL connection error. Ensure your DATABASE_URL includes proper SSL parameters."
      } else {
        errorDetails = `Database error: ${error.message}`
      }
    }

    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      details: errorDetails,
      error: errorMessage,
      duration: Date.now() - startTime,
    })
  }
}
