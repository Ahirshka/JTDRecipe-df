import { type NextRequest, NextResponse } from "next/server"
import { getCurrentSession } from "@/lib/auth-system"
import { findUserByEmail, getAllUsers, testConnection } from "@/lib/neon"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  console.log("🔍 [API-DEBUG] Auth debug request received")

  try {
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {},
      session: {},
      cookies: {},
      users: {},
    }

    // Test database connection
    console.log("🔍 [API-DEBUG] Testing database connection...")
    try {
      const dbConnected = await testConnection()
      debugInfo.database.connected = dbConnected
      debugInfo.database.status = dbConnected ? "Connected" : "Failed"
    } catch (error) {
      debugInfo.database.connected = false
      debugInfo.database.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Check cookies
    console.log("🔍 [API-DEBUG] Checking cookies...")
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get("auth_session")
      debugInfo.cookies.hasSessionCookie = !!sessionCookie
      debugInfo.cookies.sessionToken = sessionCookie?.value?.substring(0, 10) + "..." || "None"
    } catch (error) {
      debugInfo.cookies.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Check current session
    console.log("🔍 [API-DEBUG] Checking current session...")
    try {
      const session = await getCurrentSession()
      debugInfo.session.valid = session.success
      debugInfo.session.error = session.error || null
      if (session.user) {
        debugInfo.session.user = {
          id: session.user.id,
          username: session.user.username,
          email: session.user.email,
          role: session.user.role,
          status: session.user.status,
        }
      }
    } catch (error) {
      debugInfo.session.error = error instanceof Error ? error.message : "Unknown error"
    }

    // Check users in database
    console.log("🔍 [API-DEBUG] Checking users in database...")
    try {
      const users = await getAllUsers()
      debugInfo.users.count = users.length
      debugInfo.users.list = users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.created_at,
      }))

      // Check specific users
      const ownerUser = await findUserByEmail("aaronhirshka@gmail.com")
      debugInfo.users.owner = ownerUser
        ? {
            id: ownerUser.id,
            username: ownerUser.username,
            email: ownerUser.email,
            role: ownerUser.role,
            status: ownerUser.status,
            hasPasswordHash: !!ownerUser.password_hash,
          }
        : null

      const testUser = await findUserByEmail("test@example.com")
      debugInfo.users.testUser = testUser
        ? {
            id: testUser.id,
            username: testUser.username,
            email: testUser.email,
            role: testUser.role,
            status: testUser.status,
            hasPasswordHash: !!testUser.password_hash,
          }
        : null
    } catch (error) {
      debugInfo.users.error = error instanceof Error ? error.message : "Unknown error"
    }

    console.log("✅ [API-DEBUG] Debug info collected successfully")

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("❌ [API-DEBUG] Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
