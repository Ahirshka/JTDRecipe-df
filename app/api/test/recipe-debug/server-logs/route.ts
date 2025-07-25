import { type NextRequest, NextResponse } from "next/server"

// In-memory log storage (in production, you'd use a proper logging service)
interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  metadata?: Record<string, any>
}

const logs: LogEntry[] = []
const MAX_LOGS = 1000 // Keep only the last 1000 logs

// Add log entry function - REQUIRED EXPORT
export function addLog(
  level: "info" | "warn" | "error" | "debug",
  message: string,
  metadata?: Record<string, any>,
): void {
  const logEntry: LogEntry = {
    id: Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata,
  }

  logs.unshift(logEntry) // Add to beginning of array

  // Keep only the most recent logs
  if (logs.length > MAX_LOGS) {
    logs.splice(MAX_LOGS)
  }

  // Also log to console for development
  const consoleMessage = `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`

  switch (level) {
    case "error":
      console.error(consoleMessage, metadata || "")
      break
    case "warn":
      console.warn(consoleMessage, metadata || "")
      break
    case "debug":
      console.debug(consoleMessage, metadata || "")
      break
    default:
      console.log(consoleMessage, metadata || "")
  }
}

// GET endpoint - Retrieve logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const search = searchParams.get("search")

    let filteredLogs = [...logs]

    // Filter by level
    if (level && ["info", "warn", "error", "debug"].includes(level)) {
      filteredLogs = filteredLogs.filter((log) => log.level === level)
    }

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.metadata || {})
            .toLowerCase()
            .includes(searchLower),
      )
    }

    // Limit results
    filteredLogs = filteredLogs.slice(0, limit)

    return NextResponse.json({
      success: true,
      logs: filteredLogs,
      total: filteredLogs.length,
      filters: {
        level: level || "all",
        limit,
        search: search || "",
      },
    })
  } catch (error) {
    console.error("Error retrieving logs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST endpoint - Add new log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { level, message, metadata } = body

    if (!level || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Level and message are required",
        },
        { status: 400 },
      )
    }

    if (!["info", "warn", "error", "debug"].includes(level)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid log level. Must be one of: info, warn, error, debug",
        },
        { status: 400 },
      )
    }

    addLog(level, message, metadata)

    return NextResponse.json({
      success: true,
      message: "Log entry added successfully",
      entry: {
        level,
        message,
        metadata,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error adding log entry:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add log entry",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE endpoint - Clear all logs
export async function DELETE() {
  try {
    const clearedCount = logs.length
    logs.length = 0 // Clear the array

    addLog("info", `Cleared ${clearedCount} log entries`, { clearedCount })

    return NextResponse.json({
      success: true,
      message: `Cleared ${clearedCount} log entries`,
      clearedCount,
    })
  } catch (error) {
    console.error("Error clearing logs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Initialize with a welcome log
addLog("info", "Server logs system initialized", {
  maxLogs: MAX_LOGS,
  timestamp: new Date().toISOString(),
})
