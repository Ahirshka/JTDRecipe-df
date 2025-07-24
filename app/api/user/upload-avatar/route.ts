import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import jwt from "jsonwebtoken"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Invalid file type. Please upload an image." }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    // Create unique filename
    const fileExtension = file.name.split(".").pop() || "jpg"
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
      SET avatar_url = ${avatarUrl}, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      message: "Profile picture updated successfully",
    })
  } catch (error) {
    console.error("Upload avatar error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload profile picture",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
