import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth-system"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🔐 [LOGIN-API] Login request received")

  try {
    // Parse request body
    const body = await request.json()
    const { email, password } = body

    console.log("📝 [LOGIN-API] Login attempt for email:", email)

    // Validate input
    if (!email || !password) {
      console.log("❌ [LOGIN-API] Missing email or password")
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Attempt login
    const loginResult = await loginUser(email, password)

    if (!loginResult) {
      console.log("❌ [LOGIN-API] Login failed - invalid credentials")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const { user, token } = loginResult

    console.log("✅ [LOGIN-API] Login successful for user:", {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Set authentication cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("🍪 [LOGIN-API] Authentication cookie set")

    // Return success response (without password_hash)
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userResponse,
    })
  } catch (error) {
    console.error("❌ [LOGIN-API] Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
