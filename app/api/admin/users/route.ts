import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { sql } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [ADMIN-USERS] Fetching users list")

    // Get current user and check permissions
    const user = await getCurrentUser(request)

    if (!user) {
      console.log("❌ [ADMIN-USERS] No authenticated user")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "owner") {
      console.log("❌ [ADMIN-USERS] Insufficient permissions:", user.role)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [ADMIN-USERS] Authorized admin access:", user.username)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const status = searchParams.get("status") || ""

    const offset = (page - 1) * limit

    // Build query conditions
    const whereConditions = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`)
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex++
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const countResult = await sql.unsafe(countQuery, queryParams)
    const total = Number.parseInt(countResult[0]?.total || "0")

    // Get users
    const usersQuery = `
      SELECT 
        id, username, email, role, status, is_verified, is_profile_verified,
        avatar_url, created_at, updated_at, last_login_at
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `
    queryParams.push(limit, offset)

    const users = await sql.unsafe(usersQuery, queryParams)

    console.log("✅ [ADMIN-USERS] Retrieved users:", users.length)

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filters: {
        search,
        role,
        status,
      },
    })
  } catch (error) {
    console.error("❌ [ADMIN-USERS] Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [ADMIN-USERS] Creating new user")

    // Get current user and check permissions
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "owner") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { username, email, password, role = "user", status = "active" } = body

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE username = ${username} OR email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this username or email already exists" }, { status: 409 })
    }

    // Create new user
    const newUser = await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified, created_at, updated_at)
      VALUES (${username}, ${email}, ${password}, ${role}, ${status}, true, NOW(), NOW())
      RETURNING id, username, email, role, status, is_verified, created_at
    `

    console.log("✅ [ADMIN-USERS] User created:", newUser[0].id)

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser[0],
    })
  } catch (error) {
    console.error("❌ [ADMIN-USERS] Error creating user:", error)
    return NextResponse.json(
      {
        error: "Failed to create user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
