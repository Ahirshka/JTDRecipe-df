import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let adminUserId: number
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number }
      adminUserId = decoded.userId
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin/owner
    const adminUser = await sql`
      SELECT role FROM users WHERE id = ${adminUserId}
    `

    if (!adminUser[0] || (adminUser[0].role !== "admin" && adminUser[0].role !== "owner")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get pending recipes
    const recipes = await sql`
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at ASC
    `

    return NextResponse.json({
      success: true,
      recipes: recipes,
    })
  } catch (error) {
    console.error("Get pending recipes error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
