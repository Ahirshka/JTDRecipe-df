import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function GET() {
  try {
    await initializeDatabase()

    // Check data in key tables
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
    const pendingCount = await sql`SELECT COUNT(*) as count FROM recipes WHERE moderation_status = 'pending'`
    const approvedCount = await sql`SELECT COUNT(*) as count FROM recipes WHERE moderation_status = 'approved'`

    const stats = {
      users: Number.parseInt(userCount[0].count),
      recipes: Number.parseInt(recipeCount[0].count),
      pending: Number.parseInt(pendingCount[0].count),
      approved: Number.parseInt(approvedCount[0].count),
    }

    return NextResponse.json({
      success: true,
      message: "Database data check complete",
      details: `${stats.users} users, ${stats.recipes} recipes (${stats.pending} pending, ${stats.approved} approved)`,
      stats,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Database data check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
