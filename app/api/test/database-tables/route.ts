import { NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"

export async function GET() {
  try {
    await initializeDatabase()

    // Check if required tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `

    const tableNames = tables.map((t) => t.table_name)
    const requiredTables = [
      "users",
      "recipes",
      "recipe_ingredients",
      "recipe_instructions",
      "recipe_tags",
      "email_tokens",
    ]

    const missingTables = requiredTables.filter((table) => !tableNames.includes(table))

    return NextResponse.json({
      success: missingTables.length === 0,
      message: missingTables.length === 0 ? "All required tables exist" : `Missing tables: ${missingTables.join(", ")}`,
      details: `Found ${tableNames.length} tables`,
      tables: tableNames,
      missing: missingTables,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Database table check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
