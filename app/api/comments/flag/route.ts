import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let userId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is moderator/admin/owner
    const [user] = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `

    if (!user || !["moderator", "admin", "owner"].includes(user.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { commentId, reason } = await request.json()

    if (!commentId) {
      return NextResponse.json({ success: false, error: "Comment ID is required" }, { status: 400 })
    }

    // Flag the comment
    await sql`
      UPDATE comments 
      SET is_flagged = true, flag_reason = ${reason || "Flagged by moderator"}, updated_at = NOW()
      WHERE id = ${commentId}
    `

    return NextResponse.json({
      success: true,
      message: "Comment flagged successfully",
    })
  } catch (error) {
    console.error("Flag comment error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to flag comment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
