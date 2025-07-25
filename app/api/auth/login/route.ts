import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth"
import { setAuthCookie } from "@/lib/server-auth"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [LOGIN] Processing login request")

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      console.log("❌ [LOGIN] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("🔍 [LOGIN] Attempting login for:", email)

    const result = await loginUser(email, password)

    if (!result.success) {
      console.log("❌ [LOGIN] Login failed:", result.error)
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    if (!result.token || !result.user) {
      console.log("❌ [LOGIN] Missing token or user in result")
      return NextResponse.json({ error: "Login failed" }, { status: 500 })
    }

    console.log("✅ [LOGIN] Login successful, setting cookies")

    // Set the authentication cookie
    await setAuthCookie(result.token)

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: "Login successful",
    })

    // Also set cookies in the response for immediate availability
    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    response.cookies.set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    console.log("✅ [LOGIN] Response prepared with cookies")
    return response
  } catch (error) {
    console.error("❌ [LOGIN] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
