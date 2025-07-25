import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest } from "@/lib/server-auth"
import { updateUserById } from "@/lib/neon"
import { addLog } from "../../test/server-logs/route"

export async function GET(request: NextRequest) {
  try {
    addLog("info", "[AUTH-ME] Fetching current user information")

    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      addLog("error", "[AUTH-ME] No authenticated user found")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    addLog("info", "[AUTH-ME] Current user retrieved", {
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    // Return user information without sensitive data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        is_profile_verified: user.is_profile_verified,
        avatar_url: user.avatar_url,
        bio: user.bio,
        location: user.location,
        website: user.website,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
      },
    })
  } catch (error) {
    addLog("error", "[AUTH-ME] Error fetching current user", { error })
    console.error("❌ [AUTH-ME] Error:", error)
    return NextResponse.json({ error: "Failed to fetch user information" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    addLog("info", "[AUTH-ME] Processing profile update request")

    const user = await getCurrentUserFromRequest(request)

    if (!user) {
      addLog("error", "[AUTH-ME] No authenticated user found for update")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { bio, location, website } = body

    addLog("info", "[AUTH-ME] Updating user profile", {
      userId: user.id,
      hasBio: !!bio,
      hasLocation: !!location,
      hasWebsite: !!website,
    })

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (bio !== undefined) updates.bio = bio
    if (location !== undefined) updates.location = location
    if (website !== undefined) updates.website = website

    await updateUserById(user.id, updates)

    addLog("info", "[AUTH-ME] Profile updated successfully", {
      userId: user.id,
      updatedFields: Object.keys(updates),
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    addLog("error", "[AUTH-ME] Error updating profile", { error })
    console.error("❌ [AUTH-ME] Error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
