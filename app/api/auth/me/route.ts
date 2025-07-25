import { type NextRequest, NextResponse } from "next/server"
import { findUserById, findSessionByToken } from "@/lib/neon"
import jwt from "jsonwebtoken"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [AUTH-ME] Checking authentication")

    // Get token from cookie
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      console.log("❌ [AUTH-ME] No auth token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    console.log("🔍 [AUTH-ME] Token found, verifying...")

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || "fallback-secret-key-for-development"
    let decoded: any
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtError) {
      console.log("❌ [AUTH-ME] Invalid JWT token:", jwtError)
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    console.log("🔍 [AUTH-ME] JWT verified, checking session...")

    // Check if session exists and is valid
    const session = await findSessionByToken(token)
    if (!session) {
      console.log("❌ [AUTH-ME] Session not found or expired")
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 })
    }

    console.log("🔍 [AUTH-ME] Session valid, finding user...")

    // Get user data
    const user = await findUserById(decoded.userId)
    if (!user) {
      console.log("❌ [AUTH-ME] User not found:", decoded.userId)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("✅ [AUTH-ME] User authenticated:", user.username)

    // Return user data (without sensitive information)
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
    console.error("❌ [AUTH-ME] Authentication check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
