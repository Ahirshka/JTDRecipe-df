import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Initialize database
    const initResponse = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/init-db`, {
      method: "POST",
    })
    const initResult = await initResponse.json()

    if (!initResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Database initialization failed",
          error: initResult.message,
        },
        { status: 500 },
      )
    }

    // Seed database
    const seedResponse = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/seed-database`, {
      method: "POST",
    })
    const seedResult = await seedResponse.json()

    return NextResponse.json({
      success: true,
      message: "Auto-initialization completed successfully",
      data: {
        initialization: initResult.data,
        seeding: seedResult.success ? seedResult.data : { error: seedResult.message },
      },
    })
  } catch (error) {
    console.error("Auto-init error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Auto-initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
