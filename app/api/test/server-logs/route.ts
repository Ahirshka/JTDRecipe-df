import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"

// In-memory log storage (for demonstration - in production use a proper logging service)
const logs: Array<{
  id: string
  timestamp: string
  level: "info" | "warn" | "error"
  message: string
  data?: any
}> = []

export function addLog(level: "info" | "warn" | "error", message: string, data?: any) {
  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }

  logs.push(logEntry)

  // Keep only last 1000 logs to prevent memory issues
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000)
  }

  // Also log to console
  const logMessage = `[${level.toUpperCase()}] ${message}`
  if (data) {
    console.log(logMessage, data)
  } else {
    console.log(logMessage)
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [SERVER-LOGS] Fetching recent server logs")

    // Get current user for security
    const user = await getCurrentUser(request)

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      console.log("❌ [SERVER-LOGS] Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    console.log("✅ [SERVER-LOGS] Authorized user accessing logs:", user.username)

    const url = new URL(request.url)
    const level = url.searchParams.get("level")
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")

    let filteredLogs = logs

    if (level && ["info", "warn", "error"].includes(level)) {
      filteredLogs = logs.filter((log) => log.level === level)
    }

    // Get most recent logs
    const recentLogs = filteredLogs.slice(-limit).reverse()

    return NextResponse.json({
      success: true,
      logs: recentLogs,
      total: filteredLogs.length,
    })
  } catch (error) {
    console.error("❌ [SERVER-LOGS] Error fetching logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch server logs", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [SERVER-LOGS] Adding/clearing server logs")

    // Get current user for security
    const user = await getCurrentUser(request)

    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    const body = await request.json()

    if (body.action === "clear") {
      // Clear the logs array
      logs.length = 0
      addLog("info", "Server logs cleared by:", user.username)

      return NextResponse.json({
        success: true,
        message: "Server logs cleared successfully",
        timestamp: new Date().toISOString(),
      })
    } else {
      // Add a log entry
      const { level, message, data } = body

      if (!level || !message) {
        return NextResponse.json({ error: "Level and message are required" }, { status: 400 })
      }

      addLog(level, message, data)

      return NextResponse.json({
        success: true,
        message: "Log added successfully",
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("❌ [SERVER-LOGS] Error processing request:", error)
    return NextResponse.json(
      {
        error: "Failed to process server logs request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE() {
  try {
    logs.length = 0
    addLog("info", "Server logs cleared")

    return NextResponse.json({
      success: true,
      message: "Logs cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing logs:", error)
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 })
  }
}
