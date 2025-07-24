import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 })
    }

    // Check if user is admin or owner
    const userResult = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (userResult.length === 0 || !["admin", "owner"].includes(userResult[0].role)) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const status = searchParams.get("status") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    let query = `
      SELECT id, username, email, role, status, is_verified, is_profile_verified, 
             avatar_url, bio, location, website, created_at, updated_at, last_login_at
      FROM users 
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (search) {
      query += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (role) {
      query += ` AND role = $${paramIndex}`
      params.push(role)
      paramIndex++
    }

    if (status) {
      query += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const users = await sql(query, params)

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE 1=1"
    const countParams: any[] = []
    let countParamIndex = 1

    if (search) {
      countQuery += ` AND (username ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex})`
      countParams.push(`%${search}%`)
      countParamIndex++
    }

    if (role) {
      countQuery += ` AND role = $${countParamIndex}`
      countParams.push(role)
      countParamIndex++
    }

    if (status) {
      countQuery += ` AND status = $${countParamIndex}`
      countParams.push(status)
      countParamIndex++
    }

    const totalResult = await sql(countQuery, countParams)
    const total = Number.parseInt(totalResult[0].total)

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      return NextResponse.json({ success: false, error: "Invalid authentication token" }, { status: 401 })
    }

    // Check if user is admin or owner
    const userResult = await sql`
      SELECT role FROM users WHERE id = ${decoded.userId}
    `

    if (userResult.length === 0 || !["admin", "owner"].includes(userResult[0].role)) {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, updates } = body

    if (!userId || !updates) {
      return NextResponse.json({ success: false, error: "User ID and updates are required" }, { status: 400 })
    }

    // Build update query
    const allowedFields = ["status", "role", "is_verified", "is_profile_verified"]
    const updateFields = Object.keys(updates).filter((key) => allowedFields.includes(key))

    if (updateFields.length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 })
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(", ")
    const values = [userId, ...updateFields.map((field) => updates[field])]

    const result = await sql(
      `
      UPDATE users 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING id, username, email, role, status, is_verified, is_profile_verified
    `,
      values,
    )

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: result[0],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}
