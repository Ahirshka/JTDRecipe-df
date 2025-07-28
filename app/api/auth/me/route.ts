import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-development"

export const dynamic = "force-dynamic"

interface TokenPayload {
  userId: string
  email: string
  role: string
  username: string
  iat?: number
  exp?: number
}

export async function GET(request: NextRequest) {
  console.log("👤 [AUTH-ME] Getting current user")

  try {
    // Try to get token from multiple cookie names
    let token = request.cookies.get("auth-token")?.value
    if (!token) token = request.cookies.get("auth_token")?.value
    if (!token) token = request.cookies.get("session_token")?.value

    console.log("🔍 [AUTH-ME] Token search results:", {
      authToken: !!request.cookies.get("auth-token")?.value,
      authTokenAlt: !!request.cookies.get("auth_token")?.value,
      sessionToken: !!request.cookies.get("session_token")?.value,
      foundToken: !!token,
    })

    if (!token) {
      console.log("❌ [AUTH-ME] No authentication token found")
      return NextResponse.json({ success: false, error: "No authentication token" }, { status: 401 })
    }

    // Verify JWT token
    console.log("🔍 [AUTH-ME] Verifying JWT token...")
    let payload: TokenPayload
    try {
      payload = jwt.verify(token, JWT_SECRET, {
        issuer: "recipe-site",
        audience: "recipe-site-users",
      }) as TokenPayload

      console.log("✅ [AUTH-ME] JWT token verified:", {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        username: payload.username,
      })
    } catch (jwtError) {
      console.log("❌ [AUTH-ME] JWT verification failed:", jwtError)
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    // Get user from database to ensure they still exist and are active
    console.log("🔍 [AUTH-ME] Fetching user from database...")
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, updated_at
      FROM users
      WHERE id = ${payload.userId}
        AND status = 'active'
    `

    if (users.length === 0) {
      console.log("❌ [AUTH-ME] User not found or inactive:", payload.userId)
      return NextResponse.json({ success: false, error: "User not found or inactive" }, { status: 401 })
    }

    const user = users[0]
    console.log("✅ [AUTH-ME] User found and active:", {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    })

    // Return user data (excluding sensitive information)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      message: "User retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get current user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
