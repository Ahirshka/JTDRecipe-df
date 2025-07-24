import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let adminUserId: number
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number }
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
      SELECT id, username, email, role, is_verified, created_at, 
             COALESCE(status, 'active') as status,
             COALESCE(last_login_at, created_at) as last_login_at
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
      users: users,
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number }
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

    let updateQuery = ""
    let params: any[] = []

    switch (action) {
      case "block":
        updateQuery = `UPDATE users SET status = 'blocked', updated_at = NOW() WHERE id = $1 RETURNING *`
        params = [userId]
        break
      case "unblock":
        updateQuery = `UPDATE users SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING *`
        params = [userId]
        break
      case "suspend":
        updateQuery = `UPDATE users SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *`
        params = [userId]
        break
      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    const result = await sql.unsafe(updateQuery, params)

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
