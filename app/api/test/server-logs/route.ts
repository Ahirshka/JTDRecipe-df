import { type NextRequest, NextResponse } from "next/server"

// In-memory log storage
interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  data?: any
}

let logs: LogEntry[] = []
let logCounter = 0

// Add log function that can be imported by other files
export function addLog(level: LogEntry["level"], message: string, data?: any) {
  const logEntry: LogEntry = {
    id: `log_${++logCounter}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }

  logs.push(logEntry)

  // Keep only last 1000 logs to prevent memory issues
  if (logs.length > 1000) {
    logs = logs.slice(-1000)
  }

  // Also log to console for server-side debugging
  const consoleMessage = `[${level.toUpperCase()}] ${message}`
  switch (level) {
    case "error":
      console.error(consoleMessage, data || "")
      break
    case "warn":
      console.warn(consoleMessage, data || "")
      break
    case "debug":
      console.debug(consoleMessage, data || "")
      break
    default:
      console.log(consoleMessage, data || "")
  }
}

// GET - Retrieve logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let filteredLogs = logs

    if (level && level !== "all") {
      filteredLogs = logs.filter((log) => log.level === level)
    }

    // Return most recent logs first, limited by the limit parameter
    const recentLogs = filteredLogs.slice(-limit).reverse()

    return NextResponse.json({
      success: true,
      logs: recentLogs,
      total: filteredLogs.length,
    })
  } catch (error) {
    console.error("Error retrieving logs:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve logs" }, { status: 500 })
  }
}

// POST - Add a new log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { level, message, data } = body

    if (!level || !message) {
      return NextResponse.json({ success: false, error: "Level and message are required" }, { status: 400 })
    }

    addLog(level, message, data)

    return NextResponse.json({
      success: true,
      message: "Log entry added successfully",
    })
  } catch (error) {
    console.error("Error adding log:", error)
    return NextResponse.json({ success: false, error: "Failed to add log entry" }, { status: 500 })
  }
}

// DELETE - Clear all logs
export async function DELETE() {
  try {
    logs = []
    logCounter = 0

    addLog("info", "All logs cleared")

    return NextResponse.json({
      success: true,
      message: "All logs cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing logs:", error)
    return NextResponse.json({ success: false, error: "Failed to clear logs" }, { status: 500 })
  }
}
