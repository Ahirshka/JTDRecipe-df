import { NextResponse } from "next/server"
import { autoInitializeDatabase } from "@/lib/auto-init"

export async function GET() {
  try {
    const success = await autoInitializeDatabase()

    return NextResponse.json({
      success,
      message: success ? "Database auto-initialized successfully" : "Database auto-initialization failed",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Auto-initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return GET() // Same logic for POST requests
}
