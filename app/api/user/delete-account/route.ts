import { NextResponse } from "next/server"
import { getCurrentUser, logoutUser } from "@/lib/auth-actions"
import { sql } from "@/lib/neon"
import { unlink } from "fs/promises"
import { join } from "path"

export async function DELETE() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get user data before deletion
    const userData = await sql`
      SELECT avatar FROM users WHERE id = ${user.id}
    `

    if (userData.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const avatarPath = userData[0].avatar

    // Start transaction-like operations
    try {
      // Delete user's sessions
      await sql`DELETE FROM user_sessions WHERE user_id = ${user.id}`

      // Delete user's recipe ingredients
      await sql`
        DELETE FROM recipe_ingredients 
        WHERE recipe_id IN (SELECT id FROM recipes WHERE author_id = ${user.id})
      `

      // Delete user's recipe instructions
      await sql`
        DELETE FROM recipe_instructions 
        WHERE recipe_id IN (SELECT id FROM recipes WHERE author_id = ${user.id})
      `

      // Delete user's recipes
      await sql`DELETE FROM recipes WHERE author_id = ${user.id}`

      // Delete user's ratings/reviews
      await sql`DELETE FROM recipe_ratings WHERE user_id = ${user.id}`

      // Delete user's favorites
      await sql`DELETE FROM user_favorites WHERE user_id = ${user.id}`

      // Delete the user account
      await sql`DELETE FROM users WHERE id = ${user.id}`

      // Delete avatar file from disk if it exists
      if (avatarPath && avatarPath.startsWith("/uploads/")) {
        try {
          const filePath = join(process.cwd(), "public", avatarPath)
          await unlink(filePath)
        } catch (error) {
          // File might not exist, continue anyway
          console.log("Could not delete avatar file:", error)
        }
      }

      // Logout user (clear session cookie)
      await logoutUser()

      return NextResponse.json({
        success: true,
        message: "Account deleted successfully",
      })
    } catch (dbError) {
      console.error("Database error during account deletion:", dbError)
      return NextResponse.json({ success: false, error: "Failed to delete account data" }, { status: 500 })
    }
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
