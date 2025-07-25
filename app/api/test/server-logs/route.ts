import { type NextRequest, NextResponse } from "next/server"

// In-memory log storage (in production, use a proper logging service)
const logs: Array<{
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  message: string
  data?: any
}> = []

export function addLog(level: "info" | "warn" | "error" | "debug", message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }

  logs.push(logEntry)

  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.shift()
  }

  // Also log to console
  console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, data || "")

  return logEntry
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      logs: logs.slice(-100), // Return last 100 logs
      total: logs.length,
    })
  } catch (error) {
    console.error("Error fetching server logs:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch server logs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { level, message, data } = await request.json()

    if (!level || !message) {
      return NextResponse.json({ success: false, error: "Level and message are required" }, { status: 400 })
    }

    const logEntry = addLog(level, message, data)

    return NextResponse.json({
      success: true,
      log: logEntry,
    })
  } catch (error) {
    console.error("Error adding server log:", error)
    return NextResponse.json({ success: false, error: "Failed to add server log" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    logs.length = 0 // Clear all logs

    return NextResponse.json({
      success: true,
      message: "All logs cleared",
    })
  } catch (error) {
    console.error("Error clearing server logs:", error)
    return NextResponse.json({ success: false, error: "Failed to clear server logs" }, { status: 500 })
  }
}
