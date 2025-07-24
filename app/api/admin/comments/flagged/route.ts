import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Get flagged comments for admin review
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

    const flaggedComments = await sql`
      SELECT 
        c.*,
        u.username,
        u.avatar_url,
        r.title as recipe_title,
        flagger.username as flagged_by_username
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN recipes r ON c.recipe_id = r.id
      LEFT JOIN users flagger ON c.flagged_by = flagger.id
      WHERE c.is_flagged = true AND c.status != 'rejected'
      ORDER BY c.flagged_at DESC
    `

    return NextResponse.json({
      success: true,
      comments: flaggedComments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        user_id: comment.user_id,
        username: comment.username,
        avatar_url: comment.avatar_url,
        recipe_id: comment.recipe_id,
        recipe_title: comment.recipe_title,
        created_at: comment.created_at,
        flagged_at: comment.flagged_at,
        flagged_by_username: comment.flagged_by_username,
        flag_reason: comment.flag_reason,
        status: comment.status,
      })),
    })
  } catch (error) {
    console.error("Get flagged comments error:", error)
    return NextResponse.json({ success: false, error: "Failed to get flagged comments" }, { status: 500 })
  }
}

// Moderate flagged comment (approve/reject/unflag)
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

    if (!commentId || !["approve", "reject", "unflag"].includes(action)) {
      return NextResponse.json({ success: false, error: "Valid comment ID and action required" }, { status: 400 })
    }

    let updateQuery = ""
    let params: any[] = []

    switch (action) {
      case "approve":
        updateQuery = `
          UPDATE comments 
          SET 
            status = 'approved',
            is_flagged = false,
            moderation_reason = $2,
            moderated_by = $3,
            moderated_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `
        params = [commentId, reason || null, decoded.userId]
        break
      case "reject":
        updateQuery = `
          UPDATE comments 
          SET 
            status = 'rejected',
            is_flagged = false,
            moderation_reason = $2,
            moderated_by = $3,
            moderated_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `
        params = [commentId, reason || null, decoded.userId]
        break
      case "unflag":
        updateQuery = `
          UPDATE comments 
          SET 
            is_flagged = false,
            moderation_reason = $2,
            moderated_by = $3,
            moderated_at = NOW(),
            updated_at = NOW()
          WHERE id = $1
        `
        params = [commentId, reason || null, decoded.userId]
        break
    }

    await sql.unsafe(updateQuery, params)

    return NextResponse.json({
      success: true,
      message: `Comment ${action}d successfully`,
    })
  } catch (error) {
    console.error("Moderate flagged comment error:", error)
    return NextResponse.json({ success: false, error: "Failed to moderate comment" }, { status: 500 })
  }
}
