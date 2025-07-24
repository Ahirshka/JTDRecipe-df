import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-actions"
import { sql } from "@/lib/neon"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large" }, { status: 400 })
    }

    // Create unique filename
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "avatars")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save file to disk
    const filePath = join(uploadsDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`

    await sql`
      UPDATE users 
      SET avatar = ${avatarUrl}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
      message: "Profile picture updated successfully",
    })
  } catch (error) {
    console.error("Upload avatar error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
