import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"
import { unlink } from "fs/promises"
import { join } from "path"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function DELETE(request: NextRequest) {
  try {
    // Get user from JWT token
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    let userId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }
      userId = decoded.userId
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Get current avatar URL
    const [user] = await sql`
      SELECT avatar_url FROM users WHERE id = ${userId}
    `

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Delete file from disk if it exists
    if (user.avatar_url && user.avatar_url.startsWith("/uploads/")) {
      try {
        const filePath = join(process.cwd(), "public", user.avatar_url)
        await unlink(filePath)
      } catch (error) {
        // File might not exist, continue anyway
        console.log("Could not delete file:", error)
      }
    }

    // Update user avatar in database
    await sql`
      UPDATE users 
      SET avatar_url = NULL, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully",
    })
  } catch (error) {
    console.error("Delete avatar error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove profile picture",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
