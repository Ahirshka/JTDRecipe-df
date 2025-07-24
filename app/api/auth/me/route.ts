import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
      })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
        error: "Database not configured",
      })
    }

    const sql = neon(process.env.DATABASE_URL)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number }

      const users = await sql`
        SELECT id, username, email, role, status, email_verified, avatar, created_at, last_login_at
        FROM users 
        WHERE id = ${decoded.userId}
      `

      if (!users || users.length === 0) {
        return NextResponse.json({
          success: false,
          authenticated: false,
          user: null,
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
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
      })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({
      success: false,
      authenticated: false,
      user: null,
      error: "Authentication check failed",
    })
  }
}
