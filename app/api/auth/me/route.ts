import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { findUserById, findSessionByToken } from "@/lib/neon"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 [AUTH-ME] Checking authentication")

    const cookieStore = cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      console.log("❌ [AUTH-ME] No token found")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Verify JWT token
    let decoded: any
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      console.log("❌ [AUTH-ME] Invalid JWT token")
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Check if session exists in database
    const session = await findSessionByToken(token)
    if (!session) {
      console.log("❌ [AUTH-ME] Session not found in database")
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 })
    }

    // Get current user data
    const user = await findUserById(decoded.userId)
    if (!user) {
      console.log("❌ [AUTH-ME] User not found:", decoded.userId)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 401 })
    }

    // Check if user is still active
    if (user.status !== "active") {
      console.log("❌ [AUTH-ME] User account not active")
      return NextResponse.json({ success: false, error: "Account not active" }, { status: 401 })
    }

    console.log("✅ [AUTH-ME] User authenticated:", user.username)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        is_verified: user.is_verified,
      },
    })
  } catch (error) {
    console.error("❌ [AUTH-ME] Authentication check error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}
