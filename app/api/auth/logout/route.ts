import { NextResponse } from "next/server"
import { deleteSession } from "@/lib/auth-system"

export const dynamic = "force-dynamic"

export async function POST() {
  console.log("🚪 [LOGOUT-API] Logout request received")

  try {
    // Delete session (clears cookie)
    const success = await deleteSession()

    if (success) {
      console.log("✅ [LOGOUT-API] Logout successful")
      return NextResponse.json({
        success: true,
        message: "Logout successful",
      })
    } else {
      console.log("⚠️ [LOGOUT-API] Logout had issues but proceeding")
      return NextResponse.json({
        success: true,
        message: "Logout completed",
      })
    }
  } catch (error) {
    console.error("❌ [LOGOUT-API] Logout error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
