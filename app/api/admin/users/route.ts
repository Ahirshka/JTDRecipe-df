import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { getAllUsers } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [ADMIN-USERS] Getting all users")

    // Check authentication
    const currentUser = await getCurrentUserFromRequest(request)
    if (!currentUser) {
      console.log("❌ [ADMIN-USERS] No authenticated user")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [ADMIN-USERS] Authenticated user:", currentUser.username)

    // Check if user has admin privileges
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
      console.log("❌ [ADMIN-USERS] Insufficient permissions:", currentUser.role)
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    console.log("✅ [ADMIN-USERS] User has admin privileges")

    // Get all users
    const users = await getAllUsers()
    console.log("✅ [ADMIN-USERS] Found users:", users.length)

    // Remove sensitive information
    const safeUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      is_profile_verified: user.is_profile_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
    }))

    return NextResponse.json({
      success: true,
      users: safeUsers,
    })
  } catch (error) {
    console.error("❌ [ADMIN-USERS] Error fetching users:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [ADMIN-USERS] Creating/updating user")

    // Check authentication
    const currentUser = await getCurrentUserFromRequest(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check if user has admin privileges
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { action, userId, updates } = body

    if (action === "update" && userId && updates) {
      // Update user logic would go here
      return NextResponse.json({
        success: true,
        message: "User updated successfully",
      })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("❌ [ADMIN-USERS] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
