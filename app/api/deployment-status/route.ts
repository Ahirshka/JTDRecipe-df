import { NextResponse } from "next/server"

export async function GET() {
  try {
    const requiredEnvVars = ["DATABASE_URL", "RESEND_API_KEY", "FROM_EMAIL", "NEXT_PUBLIC_APP_URL", "JWT_SECRET"]

    // Check environment variables
    const envStatus: Record<string, boolean> = {}
    const missingVariables: string[] = []

    requiredEnvVars.forEach((varName) => {
      const isSet = !!process.env[varName]
      envStatus[varName.toLowerCase()] = isSet
      if (!isSet) {
        missingVariables.push(varName)
      }
    })

    const allConfigured = missingVariables.length === 0

    // Get deployment info
    const deployment = {
      environment: process.env.NODE_ENV || "development",
      vercel_env: process.env.VERCEL_ENV || "development",
      vercel_region: process.env.VERCEL_REGION || "unknown",
      vercel_url: process.env.VERCEL_URL || "unknown",
      git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
      git_branch: process.env.VERCEL_GIT_COMMIT_REF || "unknown",
      production_ready: allConfigured && process.env.VERCEL_ENV === "production",
      env_status: envStatus,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      status: allConfigured ? "ready" : "configuration_needed",
      message: allConfigured
        ? "All environment variables configured"
        : `Missing ${missingVariables.length} environment variables`,
      deployment,
      missingVariables,
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV,
        vercel_region: process.env.VERCEL_REGION,
        app_url: process.env.NEXT_PUBLIC_APP_URL,
      },
    })
  } catch (error) {
    console.error("Deployment status check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get deployment status",
        details: error instanceof Error ? error.message : "Unknown error",
        deployment: {
          environment: process.env.NODE_ENV || "development",
          vercel_env: process.env.VERCEL_ENV || "development",
          production_ready: false,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 },
    )
  }
}
