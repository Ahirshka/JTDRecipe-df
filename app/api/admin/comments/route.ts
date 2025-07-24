import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Get pending comments for moderation
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin/moderator
    const user = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (!user.length || !["admin", "owner", "moderator"].includes(user[0].role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const comments = await sql`
      SELECT 
        c.*,
        u.username,
        u.avatar_url,
        r.title as recipe_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN recipes r ON c.recipe_id = r.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at ASC
    `

    return NextResponse.json({
      success: true,
      comments: comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        user_id: comment.user_id,
        username: comment.username,
        avatar_url: comment.avatar_url,
        recipe_id: comment.recipe_id,
        recipe_title: comment.recipe_title,
        created_at: comment.created_at,
        status: comment.status,
      })),
    })
  } catch (error) {
    console.error("Get pending comments error:", error)
    return NextResponse.json({ success: false, error: "Failed to get pending comments" }, { status: 500 })
  }
}

// Moderate comment (approve/reject)
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin/moderator
    const user = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (!user.length || !["admin", "owner", "moderator"].includes(user[0].role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { commentId, action, reason } = await request.json()

    if (!commentId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Valid comment ID and action required" }, { status: 400 })
    }

    const status = action === "approve" ? "approved" : "rejected"

    await sql`
      UPDATE comments 
      SET 
        status = ${status},
        moderation_reason = ${reason || null},
        moderated_by = ${decoded.userId},
        moderated_at = NOW(),
        updated_at = NOW()
      WHERE id = ${commentId}
    `

    return NextResponse.json({
      success: true,
      message: `Comment ${action}d successfully`,
    })
  } catch (error) {
    console.error("Moderate comment error:", error)
    return NextResponse.json({ success: false, error: "Failed to moderate comment" }, { status: 500 })
  }
}
