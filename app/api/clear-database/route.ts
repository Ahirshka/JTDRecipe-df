import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log("🗑️ Starting database cleanup...")

    // Clear all data except owner account
    await sql`DELETE FROM comments`
    await sql`DELETE FROM recipes WHERE user_id != 1`
    await sql`DELETE FROM users WHERE id != 1`

    // Reset sequences
    await sql`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`
    await sql`SELECT setval('recipes_id_seq', (SELECT MAX(id) FROM recipes))`
    await sql`SELECT setval('comments_id_seq', (SELECT MAX(id) FROM comments))`

    console.log("✅ Database cleared successfully!")

    return NextResponse.json({
      success: true,
      message: "Database cleared (owner account preserved)",
      data: {
        preserved: "Owner account and any owner recipes",
        cleared: "All other users, recipes, and comments",
      },
    })
  } catch (error) {
    console.error("❌ Database cleanup failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to clear database",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to clear all database data (except owner)",
    warning: "This action is destructive and cannot be undone",
    endpoints: {
      clear: "POST /api/clear-database",
      seed: "POST /api/seed-database",
      init: "POST /api/init-db",
    },
  })
}
