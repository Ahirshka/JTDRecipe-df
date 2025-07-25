import { type NextRequest, NextResponse } from "next/server"

interface LogEntry {
  id: string
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  context?: any
}

// In-memory log storage (in production, you'd use a proper logging service)
let logs: LogEntry[] = []

export function addLog(level: LogEntry["level"], message: string, context?: any): void {
  const logEntry: LogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  }

  logs.push(logEntry)

  // Keep only the last 1000 logs to prevent memory issues
  if (logs.length > 1000) {
    logs = logs.slice(-1000)
  }

  // Also log to console for development
  const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ""
  const logMessage = `[${level.toUpperCase()}] ${message}${contextStr}`

  switch (level) {
    case "error":
      console.error(logMessage)
      break
    case "warn":
      console.warn(logMessage)
      break
    case "debug":
      console.debug(logMessage)
      break
    default:
      console.log(logMessage)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let filteredLogs = logs

    // Filter by level if specified
    if (level && ["info", "warn", "error", "debug"].includes(level)) {
      filteredLogs = logs.filter((log) => log.level === level)
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        logs: paginatedLogs,
        total: filteredLogs.length,
        offset,
        limit,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { level, message, context } = body

    if (!level || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: level and message",
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

    addLog(level, message, context)

    return NextResponse.json({
      success: true,
      message: "Log entry added successfully",
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

export async function DELETE() {
  try {
    logs = []
    console.log("🗑️ All logs cleared")

    return NextResponse.json({
      success: true,
      message: "All logs cleared successfully",
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
