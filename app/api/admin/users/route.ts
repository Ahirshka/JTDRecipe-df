import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/server-auth"
import { sql } from "@/lib/neon"
import { addLog } from "../../test/server-logs/route"

export async function GET() {
  try {
    const admin = await requireAdmin()
    addLog("info", "Admin users endpoint accessed", { adminId: admin.id })

    const users = await sql`
      SELECT id, username, email, role, is_verified, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error) {
    addLog("error", "Admin users fetch failed", { error: error.message })
    console.error("Error fetching users:", error)

    return NextResponse.json(
      { success: false, error: error.message },
      {
        status:
          error.message === "Authentication required" ? 401 : error.message === "Admin access required" ? 403 : 500,
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { action, userId, updates } = await request.json()

    addLog("info", "Admin user action", { adminId: admin.id, action, userId })

    if (action === "update") {
      const result = await sql`
        UPDATE users 
        SET ${sql.unsafe(
          Object.keys(updates)
            .map((key, i) => `${key} = $${i + 2}`)
            .join(", "),
        )}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, username, email, role, is_verified, created_at, updated_at
      `

      return NextResponse.json({
        success: true,
        user: result[0],
      })
    }

    if (action === "delete") {
      await sql`DELETE FROM users WHERE id = ${userId}`

      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
      })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    addLog("error", "Admin user action failed", { error: error.message })
    console.error("Error in admin user action:", error)

    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
