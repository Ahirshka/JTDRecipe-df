import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: "No authentication token found",
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    // Get user from database
    const users = await sql`
      SELECT id, username, email, role, status, email_verified, avatar, created_at, last_login_at
      FROM users 
      WHERE id = ${decoded.userId} AND status = 'active'
    `

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        message: "User not found or inactive",
      })
    }

    const user = users[0]

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        email_verified: user.email_verified,
        avatar: user.avatar,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({
      success: false,
      authenticated: false,
      message: "Authentication verification failed",
    })
  }
}
