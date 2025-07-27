import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 })
    }

    // Check if user is admin or owner
    const userResult = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (userResult.length === 0 || !["admin", "owner"].includes(userResult[0].role)) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const flaggedComments = await sql`
      SELECT 
        c.id,
        c.content,
        c.status,
        c.is_flagged,
        c.flag_reason,
        c.flagged_at,
        c.created_at,
        c.username as author_username,
        r.title as recipe_title,
        r.id as recipe_id,
        flagger.username as flagged_by_username
      FROM comments c
      JOIN recipes r ON c.recipe_id = r.id
      LEFT JOIN users flagger ON c.flagged_by = flagger.id
      WHERE c.is_flagged = true
      ORDER BY c.flagged_at DESC
    `

    return NextResponse.json({
      success: true,
      flaggedComments,
    })
  } catch (error) {
    console.error("Error fetching flagged comments:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch flagged comments" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 })
    }

    // Check if user is admin or owner
    const userResult = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (userResult.length === 0 || !["admin", "owner"].includes(userResult[0].role)) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { commentId, action, reason } = body

    if (!commentId || !action) {
      return NextResponse.json({ success: false, error: "Comment ID and action are required" }, { status: 400 })
    }

    let status: string
    let isApproved = false

    switch (action) {
      case "approve":
        status = "approved"
        isApproved = true
        break
      case "reject":
        status = "rejected"
        break
      case "remove":
        status = "removed"
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    const result = await sql`
      UPDATE comments 
      SET 
        status = ${status},
        is_flagged = ${!isApproved},
        moderation_reason = ${reason || null},
        moderated_by = ${decoded.userId},
        moderated_at = NOW(),
        updated_at = NOW()
      WHERE id = ${commentId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Comment ${action}d successfully`,
      comment: result[0],
    })
  } catch (error) {
    console.error("Error moderating flagged comment:", error)
    return NextResponse.json({ success: false, error: "Failed to moderate comment" }, { status: 500 })
  }
}
