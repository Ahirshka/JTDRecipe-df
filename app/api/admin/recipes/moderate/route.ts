import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    let adminUserId: number
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number }
      adminUserId = decoded.userId
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin/owner
    const adminUser = await sql`
      SELECT role FROM users WHERE id = ${adminUserId}
    `

    if (!adminUser[0] || (adminUser[0].role !== "admin" && adminUser[0].role !== "owner")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { recipeId, action, notes, edits } = body

    if (!recipeId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // If there are edits, apply them first
    if (edits && action === "approve") {
      const updateFields = []
      const updateValues = []
      let paramIndex = 1

      if (edits.title) {
        updateFields.push(`title = $${paramIndex}`)
        updateValues.push(edits.title)
        paramIndex++
      }
      if (edits.description) {
        updateFields.push(`description = $${paramIndex}`)
        updateValues.push(edits.description)
        paramIndex++
      }
      if (edits.ingredients) {
        updateFields.push(`ingredients = $${paramIndex}`)
        updateValues.push(edits.ingredients)
        paramIndex++
      }
      if (edits.instructions) {
        updateFields.push(`instructions = $${paramIndex}`)
        updateValues.push(edits.instructions)
        paramIndex++
      }
      if (edits.category) {
        updateFields.push(`category = $${paramIndex}`)
        updateValues.push(edits.category)
        paramIndex++
      }
      if (edits.difficulty) {
        updateFields.push(`difficulty = $${paramIndex}`)
        updateValues.push(edits.difficulty)
        paramIndex++
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = NOW()`)
        updateValues.push(recipeId)

        const updateQuery = `UPDATE recipes SET ${updateFields.join(", ")} WHERE id = $${paramIndex}`
        await sql.unsafe(updateQuery, updateValues)
      }
    }

    // Moderate the recipe
    const status = action === "approve" ? "approved" : "rejected"
    const isPublished = action === "approve"

    const result = await sql`
      UPDATE recipes 
      SET moderation_status = ${status}, 
          is_published = ${isPublished}, 
          moderated_by = ${adminUserId}, 
          moderated_at = NOW(),
          moderation_notes = ${notes || null}
      WHERE id = ${recipeId}
      RETURNING *
    `

    if (!result[0]) {
      return NextResponse.json({ success: false, error: "Recipe not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Recipe ${action}ed successfully`,
      recipe: result[0],
    })
  } catch (error) {
    console.error("Recipe moderation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
