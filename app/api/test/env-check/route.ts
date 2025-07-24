import { NextResponse } from "next/server"

export async function GET() {
  try {
    const requiredEnvVars = ["DATABASE_URL", "RESEND_API_KEY", "FROM_EMAIL", "NEXT_PUBLIC_APP_URL", "JWT_SECRET"]

    const environmentVariables: Record<string, any> = {}
    const missingVariables: string[] = []
    let configuredCount = 0

    // Check each environment variable
    requiredEnvVars.forEach((varName) => {
      const isConfigured = !!process.env[varName]

      environmentVariables[varName.toLowerCase().replace(/_/g, "_")] = {
        name: varName,
        configured: isConfigured,
        description: getEnvVarDescription(varName),
        required: true,
      }

      if (isConfigured) {
        configuredCount++
      } else {
        missingVariables.push(varName)
      }
    })

    const status = missingVariables.length === 0 ? "complete" : "incomplete"

    return NextResponse.json({
      success: true,
      status,
      configured_count: configuredCount,
      total_count: requiredEnvVars.length,
      environment_variables: environmentVariables,
      missing_variables: missingVariables,
      environment: process.env.NODE_ENV || "development",
      vercel_env: process.env.VERCEL_ENV || "development",
    })
  } catch (error) {
    console.error("Environment check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check environment variables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getEnvVarDescription(varName: string): string {
  const descriptions: Record<string, string> = {
    DATABASE_URL: "PostgreSQL database connection string from Neon",
    RESEND_API_KEY: "API key for Resend email service",
    FROM_EMAIL: "Email address for sending system emails",
    NEXT_PUBLIC_APP_URL: "Public URL of your application",
    JWT_SECRET: "Secret key for JWT token signing (32+ characters)",
  }

  return descriptions[varName] || "Environment variable"
}
