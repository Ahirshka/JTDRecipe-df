import { type NextRequest, NextResponse } from "next/server"
import { findSessionByToken, findUserById } from "@/lib/neon"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [AUTH_ME] Checking authentication")

    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.log("❌ [AUTH_ME] No auth token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    console.log("🔍 [AUTH_ME] Verifying JWT token")

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key"
    let decoded
    try {
      decoded = jwt.verify(token, jwtSecret) as any
    } catch (jwtError) {
      console.log("❌ [AUTH_ME] Invalid JWT token:", jwtError.message)
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    console.log("🔍 [AUTH_ME] Finding session by token")

    // Check if session exists and is valid
    const session = await findSessionByToken(token)
    if (!session) {
      console.log("❌ [AUTH_ME] Session not found or expired")
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 })
    }

    console.log("🔍 [AUTH_ME] Finding user by ID:", decoded.userId)

    // Get user data
    const user = await findUserById(decoded.userId)
    if (!user) {
      console.log("❌ [AUTH_ME] User not found:", decoded.userId)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if user account is still active
    if (user.status !== "active") {
      console.log("❌ [AUTH_ME] User account is not active:", user.status)
      return NextResponse.json({ success: false, error: "Account is not active" }, { status: 403 })
    }

    console.log("✅ [AUTH_ME] User authenticated successfully:", user.username)

    // Remove sensitive data from response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      avatar_url: user.avatar_url,
      bio: user.bio,
      location: user.location,
      website: user.website,
      created_at: user.created_at,
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
    })
  } catch (error) {
    console.error("❌ [AUTH_ME] Authentication check error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
