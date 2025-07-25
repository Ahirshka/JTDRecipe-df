import { type NextRequest, NextResponse } from "next/server"

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error"
  message: string
  data?: any
}

// In-memory log storage (in production, you'd use a proper logging service)
let logs: LogEntry[] = []

export function addLog(level: "info" | "warn" | "error", message: string, data?: any) {
  const logEntry: LogEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }

  logs.unshift(logEntry) // Add to beginning

  // Keep only the last 500 logs to prevent memory issues
  if (logs.length > 500) {
    logs = logs.slice(0, 500)
  }

  // Also log to console for debugging
  const logMethod = level === "error" ? console.error : level === "warn" ? console.warn : console.log
  logMethod(`[${level.toUpperCase()}] ${message}`, data || "")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let filteredLogs = logs

    // Filter by level if specified
    if (level && level !== "all") {
      filteredLogs = logs.filter((log) => log.level === level)
    }

    // Apply limit
    filteredLogs = filteredLogs.slice(0, limit)

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      total: logs.length,
    })
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === "clear") {
      logs = []
      return NextResponse.json({ success: true, message: "Logs cleared" })
    }

    if (body.level && body.message) {
      addLog(body.level, body.message, body.data)
      return NextResponse.json({ success: true, message: "Log added" })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Error handling log request:", error)
    return NextResponse.json({ error: "Failed to handle request" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    logs = []
    return NextResponse.json({ success: true, message: "All logs cleared" })
  } catch (error) {
    console.error("Error clearing logs:", error)
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 })
  }
}
