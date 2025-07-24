import { NextResponse } from "next/server"

export async function GET() {
  try {
    const requiredEnvVars = ["RESEND_API_KEY", "FROM_EMAIL", "NEXT_PUBLIC_APP_URL", "DATABASE_URL"]

    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar])

    const config = {
      configured: missing.length === 0,
      missing,
      present: requiredEnvVars.filter((envVar) => process.env[envVar]),
      details: {
        resend_api_key: process.env.RESEND_API_KEY ? "Set" : "Missing",
        from_email: process.env.FROM_EMAIL || "Not set",
        app_url: process.env.NEXT_PUBLIC_APP_URL || "Not set",
        database_url: process.env.DATABASE_URL ? "Set" : "Missing",
      },
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Email config check error:", error)
    return NextResponse.json(
      {
        configured: false,
        error: "Failed to check configuration",
      },
      { status: 500 },
    )
  }
}
