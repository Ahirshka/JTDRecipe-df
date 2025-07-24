import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeDatabase } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Bad words filter - in production, use a more comprehensive list
const BAD_WORDS = [
  "damn",
  "hell",
  "stupid",
  "idiot",
  "hate",
  "suck",
  "sucks",
  "crap",
  "shit",
  "fuck",
  "bitch",
  "ass",
  "asshole",
]

function containsBadLanguage(text: string): boolean {
  const lowerText = text.toLowerCase()
  return BAD_WORDS.some((word) => lowerText.includes(word))
}

// Get comments for a recipe
export async function GET(request: NextRequest) {
  try {
    await initializeDatabase()

    const { searchParams } = new URL(request.url)
    const recipeId = searchParams.get("recipeId")

    if (!recipeId) {
      return NextResponse.json({ success: false, error: "Recipe ID required" }, { status: 400 })
    }

    const comments = await sql`
      SELECT 
        c.*,
        u.username,
        u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.recipe_id = ${recipeId} 
        AND c.status = 'approved'
      ORDER BY c.created_at DESC
    `

    return NextResponse.json({
      success: true,
      comments: comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        user_id: comment.user_id,
        username: comment.username,
        avatar_url: comment.avatar_url,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
      })),
    })
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ success: false, error: "Failed to get comments" }, { status: 500 })
  }
}

// Create a new comment
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()

    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let userId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    const { recipeId, content } = await request.json()

    if (!recipeId || !content?.trim()) {
      return NextResponse.json({ success: false, error: "Recipe ID and content required" }, { status: 400 })
    }

    // Check for bad language
    const hasBadLanguage = containsBadLanguage(content)
    const status = hasBadLanguage ? "pending" : "approved"

    const result = await sql`
      INSERT INTO comments (recipe_id, user_id, content, status, created_at, updated_at)
      VALUES (${recipeId}, ${userId}, ${content.trim()}, ${status}, NOW(), NOW())
      RETURNING id, created_at
    `

    const commentId = result[0].id

    // If approved, get the comment with user info to return
    if (status === "approved") {
      const newComment = await sql`
        SELECT 
          c.*,
          u.username,
          u.avatar_url
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ${commentId}
      `

      return NextResponse.json({
        success: true,
        comment: {
          id: newComment[0].id,
          content: newComment[0].content,
          user_id: newComment[0].user_id,
          username: newComment[0].username,
          avatar_url: newComment[0].avatar_url,
          created_at: newComment[0].created_at,
          updated_at: newComment[0].updated_at,
        },
        message: "Comment posted successfully",
      })
    } else {
      return NextResponse.json({
        success: true,
        message: "Comment submitted for moderation review",
      })
    }
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 })
  }
}
