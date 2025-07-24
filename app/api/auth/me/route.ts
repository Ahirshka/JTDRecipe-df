import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: "No token provided",
      })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    if (!decoded.userId) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: "Invalid token",
      })
    }

    // Get user from database
    const users = await sql`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        is_verified, 
        is_profile_verified,
        avatar_url,
        status,
        created_at,
        last_login_at
      FROM users 
      WHERE id = ${decoded.userId}
    `

    if (!users[0]) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: "User not found",
      })
    }

    const user = users[0]

    // Check if account is active
    if (user.status !== "active") {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: "Account is not active",
      })
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        is_profile_verified: user.is_profile_verified,
        avatar_url: user.avatar_url,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: "Token verification failed",
    })
  }
}
