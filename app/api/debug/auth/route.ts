import { type NextRequest, NextResponse } from "next/server"
import { sql, getAllUsers } from "@/lib/neon"
import { getCurrentSession } from "@/lib/auth-system"

export async function GET(request: NextRequest) {
  console.log("🔄 [API] Debug auth info request")

  try {
    // Check database connection
    let databaseConnected = false
    let tablesExist = false
    let userCount = 0
    let sessionCount = 0

    try {
      await sql`SELECT 1`
      databaseConnected = true

      // Check if tables exist
      const tableCheck = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'sessions', 'recipes')
      `
      tablesExist = tableCheck.length >= 2

      if (tablesExist) {
        // Get user count
        const userCountResult = await sql`SELECT COUNT(*) as count FROM users`
        userCount = Number.parseInt(userCountResult[0].count)

        // Get session count
        const sessionCountResult = await sql`SELECT COUNT(*) as count FROM sessions WHERE expires > NOW()`
        sessionCount = Number.parseInt(sessionCountResult[0].count)
      }
    } catch (error) {
      console.error("Database check failed:", error)
    }

    // Check cookies
    const sessionToken = request.cookies.get("auth_session")?.value || null
    const hasAuthCookie = !!sessionToken

    // Get all users
    let users = []
    try {
      if (tablesExist) {
        users = await getAllUsers()
      }
    } catch (error) {
      console.error("Failed to get users:", error)
    }

    // Check current session
    let currentSession = { valid: false, user: null, error: null }
    try {
      const session = await getCurrentSession()
      currentSession = {
        valid: session.success,
        user: session.user,
        error: session.error,
      }
    } catch (error) {
      currentSession.error = error instanceof Error ? error.message : "Unknown error"
    }

    const debugInfo = {
      database: {
        connected: databaseConnected,
        tablesExist,
        userCount,
        sessionCount,
      },
      cookies: {
        sessionToken,
        hasAuthCookie,
      },
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
      })),
      currentSession,
    }

    console.log("✅ [API] Debug info compiled successfully")
    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("❌ [API] Debug auth error:", error)
    return NextResponse.json(
      {
        error: "Failed to get debug info",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
