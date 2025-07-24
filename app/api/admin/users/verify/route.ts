import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { requireAdmin } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    await requireAdmin()

    const body = await request.json()
    const { userId, verified } = body

    if (!userId || typeof verified !== "boolean") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
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
    console.error("User verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
