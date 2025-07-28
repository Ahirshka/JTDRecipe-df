import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth-system"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  console.log("🔐 [LOGIN-API] Login request received")

  try {
    const { email, password } = await request.json()

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

    console.log("🔍 [LOGIN-API] Attempting login for:", email)

    // Attempt login
    const result = await loginUser(email, password)

    if (!result) {
      console.log("❌ [LOGIN-API] Login failed for:", email)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const { user, token } = result

    console.log("✅ [LOGIN-API] Login successful for:", user.username)

    // Set authentication cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: {
        id: userWithoutPassword.id.toString(),
        username: userWithoutPassword.username,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role,
        status: userWithoutPassword.status,
        is_verified: userWithoutPassword.is_verified,
      },
      message: "Login successful",
    })
  } catch (error) {
    console.error("❌ [LOGIN-API] Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
