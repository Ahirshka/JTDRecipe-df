import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { getAllUsers } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [ADMIN-USERS] Fetching all users")

    // Get current user from request
    const currentUser = await getCurrentUserFromRequest(request)

    if (!currentUser) {
      console.log("❌ [ADMIN-USERS] No authenticated user found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("✅ [ADMIN-USERS] Authenticated user:", {
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
    })

    // Check if user has admin privileges
    if (!["admin", "owner"].includes(currentUser.role)) {
      console.log("❌ [ADMIN-USERS] Insufficient privileges:", currentUser.role)
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    // Get all users
    const users = await getAllUsers()

    console.log("✅ [ADMIN-USERS] Found users:", users.length)

    return NextResponse.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      })),
    })
  } catch (error) {
    console.error("❌ [ADMIN-USERS] Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
