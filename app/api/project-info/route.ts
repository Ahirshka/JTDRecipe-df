import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Get project information from environment and package.json
    const projectInfo = {
      name: "Just The Damn Recipe",
      domain: "justthedamnrecipe.net",
      framework: "Next.js",
      environment: process.env.NODE_ENV || "development",
      vercel_url: process.env.VERCEL_URL,
      app_url: process.env.NEXT_PUBLIC_APP_URL,
      has_database: !!process.env.DATABASE_URL,
      has_email: !!process.env.RESEND_API_KEY,
      has_jwt: !!process.env.JWT_SECRET,
      deployment_id: process.env.VERCEL_GIT_COMMIT_SHA,
      git_branch: process.env.VERCEL_GIT_COMMIT_REF,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      project: projectInfo,
      message: "Project information retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to get project information",
      },
      { status: 500 },
    )
  }
}
