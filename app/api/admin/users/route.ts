import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, isAdmin } from "@/lib/server-auth"
import { getAllUsers, updateUserById } from "@/lib/neon"
import { addLog } from "../../test/server-logs/route"

export async function GET(request: NextRequest) {
  try {
    addLog("info", "[ADMIN-USERS] Fetching users list")

    // Check authentication and admin privileges
    const currentUser = await getCurrentUserFromRequest(request)
    if (!currentUser) {
      addLog("error", "[ADMIN-USERS] Unauthorized access attempt")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!isAdmin(currentUser)) {
      addLog("error", "[ADMIN-USERS] Non-admin user attempted access", {
        userId: currentUser.id,
        role: currentUser.role,
      })
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    addLog("info", "[ADMIN-USERS] Admin access granted", {
      adminId: currentUser.id,
      adminUsername: currentUser.username,
    })

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    // Get all users from database
    const allUsers = await getAllUsers()
    let filteredUsers = allUsers

    // Apply filters
    if (search) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.username.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (role && role !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === role)
    }

    if (status && status !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.status === status)
    }

    // Remove sensitive information from response
    const safeUsers = filteredUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      is_profile_verified: user.is_profile_verified,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login_at: user.last_login_at,
      warning_count: user.warning_count || 0,
    }))

    addLog("info", "[ADMIN-USERS] Users list retrieved", {
      total: allUsers.length,
      filtered: filteredUsers.length,
    })

    return NextResponse.json({
      success: true,
      users: safeUsers,
      total: allUsers.length,
      filtered: filteredUsers.length,
    })
  } catch (error) {
    addLog("error", "[ADMIN-USERS] Error fetching users", { error })
    console.error("❌ [ADMIN-USERS] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    addLog("info", "[ADMIN-USERS] Processing user update request")

    // Check authentication and admin privileges
    const currentUser = await getCurrentUserFromRequest(request)
    if (!currentUser) {
      addLog("error", "[ADMIN-USERS] Unauthorized update attempt")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!isAdmin(currentUser)) {
      addLog("error", "[ADMIN-USERS] Non-admin user attempted update", {
        userId: currentUser.id,
        role: currentUser.role,
      })
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action, reason } = body

    if (!userId || !action) {
      addLog("error", "[ADMIN-USERS] Missing required fields", { userId, action })
      return NextResponse.json({ error: "User ID and action are required" }, { status: 400 })
    }

    addLog("info", "[ADMIN-USERS] Processing user action", {
      targetUserId: userId,
      action,
      adminId: currentUser.id,
    })

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    switch (action) {
      case "suspend":
        updates.status = "suspended"
        updates.suspension_reason = reason || "Suspended by admin"
        break
      case "block":
        updates.status = "banned"
        updates.suspension_reason = reason || "Blocked by admin"
        break
      case "unblock":
        updates.status = "active"
        updates.suspension_reason = null
        break
      case "verify":
        updates.is_verified = true
        break
      case "unverify":
        updates.is_verified = false
        break
      default:
        addLog("error", "[ADMIN-USERS] Invalid action", { action })
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Update user in database
    await updateUserById(userId, updates)

    addLog("info", "[ADMIN-USERS] User updated successfully", {
      targetUserId: userId,
      action,
      adminId: currentUser.id,
    })

    return NextResponse.json({
      success: true,
      message: `User ${action}ed successfully`,
      action,
      userId,
    })
  } catch (error) {
    addLog("error", "[ADMIN-USERS] Error updating user", { error })
    console.error("❌ [ADMIN-USERS] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
