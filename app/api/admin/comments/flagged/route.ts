import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN-FLAGGED-COMMENTS] Fetching flagged comments")

    // Check authentication
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      console.log("❌ [ADMIN-FLAGGED-COMMENTS] No authenticated user found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Check if user is admin/moderator
    if (!["admin", "owner", "moderator"].includes(user.role)) {
      console.log("❌ [ADMIN-FLAGGED-COMMENTS] User lacks moderation permissions:", { role: user.role })
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    console.log("✅ [ADMIN-FLAGGED-COMMENTS] Moderation permissions verified for user:", user.username)

    // Import sql
    const { sql } = await import("@/lib/neon")

    try {
      // Get flagged comments
      const flaggedComments = await sql`
        SELECT 
          id,
          content,
          author_username,
          recipe_id,
          is_flagged,
          flag_reason,
          created_at,
          updated_at
        FROM comments 
        WHERE is_flagged = true
        ORDER BY created_at DESC
      `

      console.log("✅ [ADMIN-FLAGGED-COMMENTS] Found flagged comments:", flaggedComments.length)

      return NextResponse.json({
        success: true,
        comments: flaggedComments,
      })
    } catch (dbError) {
      // If comments table doesn't exist, return empty array
      console.log("⚠️ [ADMIN-FLAGGED-COMMENTS] Comments table may not exist:", dbError)
      return NextResponse.json({
        success: true,
        comments: [],
      })
    }
  } catch (error) {
    console.error("❌ [ADMIN-FLAGGED-COMMENTS] Error fetching flagged comments:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch flagged comments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
