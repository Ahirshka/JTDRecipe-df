import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUserFromRequest, isAdmin } from "@/lib/server-auth"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  console.log("👥 [ADMIN-USERS] Getting users list")

  try {
    // Get current user and verify authentication
    console.log("🔍 [ADMIN-USERS] Verifying user authentication...")
    const currentUser = await getCurrentUserFromRequest(request)

    if (!currentUser) {
      console.log("❌ [ADMIN-USERS] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [ADMIN-USERS] User authenticated:", {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
    })

    // Check if user has admin privileges
    if (!isAdmin(currentUser)) {
      console.log("❌ [ADMIN-USERS] User does not have admin privileges:", {
        username: currentUser.username,
        role: currentUser.role,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
          details: `Your role '${currentUser.role}' does not have admin privileges.`,
        },
        { status: 403 },
      )
    }

    console.log("✅ [ADMIN-USERS] Admin access verified for:", currentUser.username)

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || ""
    const status = searchParams.get("status") || ""

    const offset = (page - 1) * limit

    console.log("📋 [ADMIN-USERS] Query parameters:", {
      page,
      limit,
      search,
      role,
      status,
      offset,
    })

    // Build WHERE clause
    const whereConditions = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex + 1})`)
      queryParams.push(`%${search}%`, `%${search}%`)
      paramIndex += 2
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`)
      queryParams.push(role)
      paramIndex += 1
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex}`)
      queryParams.push(status)
      paramIndex += 1
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `

    console.log("🔢 [ADMIN-USERS] Executing count query:", countQuery)
    const countResult = await sql.unsafe(countQuery, queryParams)
    const totalUsers = Number.parseInt(countResult[0]?.total || "0")

    // Get users
    const usersQuery = `
      SELECT 
        id, username, email, role, status, is_verified, 
        created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    console.log("👥 [ADMIN-USERS] Executing users query:", usersQuery)
    const users = await sql.unsafe(usersQuery, [...queryParams, limit, offset])

    console.log("✅ [ADMIN-USERS] Users retrieved:", {
      totalUsers,
      returnedUsers: users.length,
      page,
      limit,
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      users: users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage,
        hasPrevPage,
        limit,
      },
      currentUser: {
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
      },
      message: "Users retrieved successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-USERS] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("👤 [ADMIN-USERS] Creating new user")

  try {
    // Get current user and verify authentication
    const currentUser = await getCurrentUserFromRequest(request)

    if (!currentUser) {
      console.log("❌ [ADMIN-USERS] No authenticated user found")
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Check if user has admin privileges
    if (!isAdmin(currentUser)) {
      console.log("❌ [ADMIN-USERS] User does not have admin privileges")
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { username, email, password, role = "user" } = body

    console.log("📝 [ADMIN-USERS] Creating user:", { username, email, role })

    if (!username || !email || !password) {
      return NextResponse.json({ success: false, error: "Username, email, and password are required" }, { status: 400 })
    }

    // Hash password
    const bcrypt = await import("bcryptjs")
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const newUser = await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES (${username}, ${email.toLowerCase()}, ${passwordHash}, ${role}, 'active', true)
      RETURNING id, username, email, role, status, is_verified, created_at
    `

    console.log("✅ [ADMIN-USERS] User created successfully:", newUser[0].id)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        role: newUser[0].role,
        status: newUser[0].status,
        isVerified: newUser[0].is_verified,
        createdAt: newUser[0].created_at,
      },
      message: "User created successfully",
    })
  } catch (error) {
    console.error("❌ [ADMIN-USERS] Error creating user:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
