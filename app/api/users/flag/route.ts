import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    // Get moderator from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let moderatorId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      moderatorId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is moderator/admin/owner
    const [moderator] = await sql`
      SELECT role FROM users WHERE id = ${moderatorId}
    `

    if (!moderator || !["moderator", "admin", "owner"].includes(moderator.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { userId, reason } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Add flag to user
    await sql`
      UPDATE users 
      SET is_flagged = true, flag_reason = ${reason || "Flagged by moderator"}, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: "User flagged successfully",
    })
  } catch (error) {
    console.error("Flag user error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to flag user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
