import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-actions"
import { sql } from "@/lib/neon"
import { unlink } from "fs/promises"
import { join } from "path"

export async function DELETE() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get current avatar path
    const currentUser = await sql`
      SELECT avatar FROM users WHERE id = ${user.id}
    `

    if (currentUser.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const avatarPath = currentUser[0].avatar

    // Remove avatar from database
    await sql`
      UPDATE users 
      SET avatar = NULL, updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Delete file from disk if it exists
    if (avatarPath && avatarPath.startsWith("/uploads/")) {
      try {
        const filePath = join(process.cwd(), "public", avatarPath)
        await unlink(filePath)
      } catch (error) {
        // File might not exist, continue anyway
        console.log("Could not delete avatar file:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profile picture removed successfully",
    })
  } catch (error) {
    console.error("Delete avatar error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
