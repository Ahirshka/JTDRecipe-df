import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const requiredVars = ["DATABASE_URL", "RESEND_API_KEY", "FROM_EMAIL", "JWT_SECRET", "NEXT_PUBLIC_APP_URL"]

    const environmentStatus: Record<string, boolean> = {}
    const missingVars: string[] = []
    let configuredCount = 0

    requiredVars.forEach((varName) => {
      const isConfigured = !!process.env[varName]
      environmentStatus[
        varName
          .toLowerCase()
          .replace(/next_public_/g, "")
          .replace(/_/g, "_")
      ] = isConfigured

      if (isConfigured) {
        configuredCount++
      } else {
        missingVars.push(varName)
      }
    })

    const status = configuredCount === requiredVars.length ? "complete" : "incomplete"

    return NextResponse.json({
      status,
      configured_count: configuredCount,
      total_count: requiredVars.length,
      missing_variables: missingVars,
      environment_status: environmentStatus,
    })
  } catch (error) {
    console.error("Environment status check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        error: "Failed to check environment variables",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
