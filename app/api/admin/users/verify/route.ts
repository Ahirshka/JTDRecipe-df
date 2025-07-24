import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
  try {
    // Get admin user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let adminUserId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      adminUserId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin/owner
    const [adminUser] = await sql`
      SELECT role FROM users WHERE id = ${adminUserId}
    `

    if (!adminUser || !["admin", "owner"].includes(adminUser.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const { userId, verified } = await request.json()

    if (!userId || typeof verified !== "boolean") {
      return NextResponse.json({ success: false, error: "Invalid request data" }, { status: 400 })
    }

    // Update user verification status
    await sql`
      UPDATE users 
      SET is_verified = ${verified}, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: `User ${verified ? "verified" : "unverified"} successfully`,
    })
  } catch (error) {
    console.error("Verify user error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update verification status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
