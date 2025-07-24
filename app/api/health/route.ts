import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      checks: {
        database: { status: "unknown", message: "" },
        environment: { status: "unknown", message: "" },
        email: { status: "unknown", message: "" },
      },
    }

    // Check database connection
    try {
      if (!process.env.DATABASE_URL) {
        checks.checks.database = { status: "error", message: "DATABASE_URL not configured" }
      } else {
        const sql = neon(process.env.DATABASE_URL)
        await sql`SELECT 1`
        checks.checks.database = { status: "healthy", message: "Database connection successful" }
      }
    } catch (error: any) {
      checks.checks.database = { status: "error", message: `Database error: ${error.message}` }
    }

    // Check environment variables
    const requiredEnvVars = ["DATABASE_URL", "RESEND_API_KEY", "FROM_EMAIL", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"]
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

    if (missingVars.length === 0) {
      checks.checks.environment = { status: "healthy", message: "All environment variables configured" }
    } else {
      checks.checks.environment = {
        status: "error",
        message: `Missing environment variables: ${missingVars.join(", ")}`,
      }
    }

    // Check email service
    try {
      if (!process.env.RESEND_API_KEY) {
        checks.checks.email = { status: "error", message: "RESEND_API_KEY not configured" }
      } else {
        const { Resend } = require("resend")
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.apiKeys.list()
        checks.checks.email = { status: "healthy", message: "Email service connection successful" }
      }
    } catch (error: any) {
      checks.checks.email = { status: "error", message: `Email service error: ${error.message}` }
    }

    // Overall status
    const hasErrors = Object.values(checks.checks).some((check) => check.status === "error")
    checks.status = hasErrors ? "unhealthy" : "healthy"

    return NextResponse.json(checks)
  } catch (error: any) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: "error",
        message: `Health check failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
