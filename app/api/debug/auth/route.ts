import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/server-auth"
import { testConnection, findUserByEmail } from "@/lib/neon"

export async function GET() {
  try {
    console.log("🔍 [DEBUG-AUTH] Starting authentication debug check...")

    // Test database connection
    const databaseConnected = await testConnection()
    console.log("🔍 [DEBUG-AUTH] Database connection:", databaseConnected ? "OK" : "FAILED")

    // Check if owner exists
    let ownerExists = false
    try {
      const owner = await findUserByEmail("aaronhirshka@gmail.com")
      ownerExists = !!owner
      console.log("🔍 [DEBUG-AUTH] Owner account exists:", ownerExists)
      if (owner) {
        console.log("🔍 [DEBUG-AUTH] Owner details:", {
          id: owner.id,
          username: owner.username,
          email: owner.email,
          role: owner.role,
          status: owner.status,
          is_verified: owner.is_verified,
        })
      }
    } catch (error) {
      console.error("🔍 [DEBUG-AUTH] Error checking owner:", error)
      ownerExists = false
    }

    // Get current user session
    let currentUser = null
    let sessionValid = false
    try {
      currentUser = await getCurrentUser()
      sessionValid = !!currentUser
      console.log("🔍 [DEBUG-AUTH] Current user session:", sessionValid ? "VALID" : "INVALID")
      if (currentUser) {
        console.log("🔍 [DEBUG-AUTH] Current user:", {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          role: currentUser.role,
        })
      }
    } catch (error) {
      console.error("🔍 [DEBUG-AUTH] Error getting current user:", error)
      currentUser = null
      sessionValid = false
    }

    // Test results summary
    const testResults = {
      databaseConnection: databaseConnected,
      ownerAccountExists: ownerExists,
      sessionAuthentication: sessionValid,
      userLoggedIn: !!currentUser,
      timestamp: new Date().toISOString(),
    }

    console.log("🔍 [DEBUG-AUTH] Test results:", testResults)

    return NextResponse.json({
      success: true,
      currentUser: currentUser
        ? {
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            role: currentUser.role,
            status: currentUser.status,
            is_verified: currentUser.is_verified,
          }
        : null,
      sessionValid,
      databaseConnected,
      ownerExists,
      testResults,
      debugInfo: {
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? "SET" : "NOT SET",
        jwtSecret: process.env.JWT_SECRET ? "SET" : "NOT SET",
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG-AUTH] Debug check failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        currentUser: null,
        sessionValid: false,
        databaseConnected: false,
        ownerExists: false,
        testResults: null,
      },
      { status: 500 },
    )
  }
}
