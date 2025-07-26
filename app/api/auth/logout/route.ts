import { type NextRequest, NextResponse } from "next/server"
import { logoutUser } from "@/lib/auth-system"

export async function POST(request: NextRequest) {
  console.log("🔄 [API] Logout request received")

  try {
    const result = await logoutUser()

    if (result.success) {
      console.log("✅ [API] Logout successful")
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      console.log("❌ [API] Logout failed:", result.message)
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [API] Logout error:", error)
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
