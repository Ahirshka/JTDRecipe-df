import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-actions"
import { sql } from "@/lib/neon"

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { username, email, bio, location, website } = await request.json()

    // Validation
    if (!username?.trim()) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    if (username.length < 3) {
      return NextResponse.json({ success: false, error: "Username must be at least 3 characters" }, { status: 400 })
    }

    // Check if username or email is already taken by another user
    const existingUsers = await sql`
      SELECT id FROM users 
      WHERE (username = ${username} OR email = ${email.toLowerCase()}) 
        AND id != ${user.id}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Username or email already taken",
        },
        { status: 400 },
      )
    }

    // Update user profile
    await sql`
      UPDATE users 
      SET 
        username = ${username},
        email = ${email.toLowerCase()},
        bio = ${bio || null},
        location = ${location || null},
        website = ${website || null},
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
