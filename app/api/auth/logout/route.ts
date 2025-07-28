import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  console.log("🔄 [LOGOUT-API] Logout request received")

  try {
    // Clear authentication cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")

    console.log("✅ [LOGOUT-API] Logout successful")

    return NextResponse.json({
      success: true,
      message: "Logout successful",
    })
  } catch (error) {
    console.error("❌ [LOGOUT-API] Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
