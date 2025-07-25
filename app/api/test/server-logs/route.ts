import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"

// In-memory log storage (for demonstration - in production use a proper logging service)
const logs: Array<{ timestamp: string; level: string; message: string; data?: any }> = []

export function addLog(level: "info" | "warn" | "error", message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }

  logs.push(logEntry)

  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.shift()
  }

  console.log(`[${level.toUpperCase()}] ${message}`, data || "")
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level") || "all"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let filteredLogs = logs
    if (level !== "all") {
      filteredLogs = logs.filter((log) => log.level === level)
    }

    // Get most recent logs
    const recentLogs = filteredLogs.slice(-limit).reverse()

    return NextResponse.json({
      success: true,
      logs: recentLogs,
      total: filteredLogs.length,
      filters: {
        level,
        limit,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [SERVER-LOGS] Error fetching logs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch server logs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
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
      console.log("✅ [SERVER-LOGS] Server logs cleared by:", user.username)

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
