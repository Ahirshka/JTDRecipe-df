import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let adminUserId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      adminUserId = decoded.userId
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin/owner
    const adminUser = await sql`
      SELECT role FROM users WHERE id = ${adminUserId}
    `

    if (!adminUser[0] || (adminUser[0].role !== "admin" && adminUser[0].role !== "owner")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const status = searchParams.get("status") || ""

    // Build query with filters
    let query = `
      SELECT id, username, email, role, is_verified, is_profile_verified, avatar_url, 
             created_at, updated_at, last_login_at,
             COALESCE(status, 'active') as status
      FROM users 
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ` AND (username ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`
      params.push(`%${search}%`)
    }

    if (role) {
      query += ` AND role = $${params.length + 1}`
      params.push(role)
    }

    if (status) {
      query += ` AND COALESCE(status, 'active') = $${params.length + 1}`
      params.push(status)
    }

    query += ` ORDER BY created_at DESC`

    const users = await sql.unsafe(query, params)

    return NextResponse.json({
      success: true,
      users: users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        is_verified: user.is_verified,
        is_profile_verified: user.is_profile_verified,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at || user.created_at,
      })),
    })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let adminUserId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      adminUserId = decoded.userId
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin/owner
    const adminUser = await sql`
      SELECT role FROM users WHERE id = ${adminUserId}
    `

    if (!adminUser[0] || (adminUser[0].role !== "admin" && adminUser[0].role !== "owner")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, reason } = body

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Prevent self-modification
    if (userId === adminUserId) {
      return NextResponse.json({ success: false, error: "Cannot modify your own account" }, { status: 400 })
    }

    let newStatus = ""
    switch (action) {
      case "block":
        newStatus = "blocked"
        break
      case "unblock":
        newStatus = "active"
        break
      case "suspend":
        newStatus = "suspended"
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    const result = await sql`
      UPDATE users 
      SET status = ${newStatus}, updated_at = NOW() 
      WHERE id = ${userId}
      RETURNING id, username, email, role, status, is_verified, is_profile_verified, avatar_url, created_at, updated_at
    `

    if (!result[0]) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}ed successfully`,
      user: result[0],
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
