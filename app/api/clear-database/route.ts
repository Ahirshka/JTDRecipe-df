import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST() {
  try {
    console.log("🗑️ Clearing database...")

    // Clear all data in correct order (respecting foreign key constraints)
    await sql`DELETE FROM ratings`
    await sql`DELETE FROM comments`
    await sql`DELETE FROM recipes`
    await sql`DELETE FROM user_sessions`
    await sql`DELETE FROM users`

    // Reset sequences
    await sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE recipes_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE comments_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE ratings_id_seq RESTART WITH 1`
    await sql`ALTER SEQUENCE user_sessions_id_seq RESTART WITH 1`

    console.log("✅ Database cleared successfully")

    return NextResponse.json({
      success: true,
      message: "Database cleared successfully",
    })
  } catch (error) {
    console.error("Database clearing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
