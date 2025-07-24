import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number }

      // Get user from database
      const users = await sql`
        SELECT id, username, email, role, is_verified, created_at, 
               COALESCE(status, 'active') as status,
               COALESCE(last_login_at, created_at) as last_login_at,
               avatar
        FROM users 
        WHERE id = ${decoded.userId}
      `

      if (!users[0]) {
        return NextResponse.json({
          success: true,
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
          email_verified: user.is_verified,
          avatar: user.avatar,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
        },
      })
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError)
      return NextResponse.json({
        success: true,
        authenticated: false,
        user: null,
      })
    }
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
