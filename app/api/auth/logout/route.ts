import { NextResponse } from "next/server"
import { logoutUser } from "@/lib/auth-system"

export async function POST() {
  console.log("🚪 [LOGOUT-API] Logout request received")

  try {
    const result = await logoutUser()

    console.log("🔍 [LOGOUT-API] Logout result:", {
      success: result.success,
      message: result.message,
    })

    if (result.success) {
      console.log("✅ [LOGOUT-API] Logout successful")

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      console.log("❌ [LOGOUT-API] Logout failed:", result.message)

      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [LOGOUT-API] Logout error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
