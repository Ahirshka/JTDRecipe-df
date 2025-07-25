import { NextResponse } from "next/server"
import { testConnection, findUserByEmail, sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("🔍 [DEBUG-AUTH] Starting authentication debug check...")

    // Test database connection
    const databaseConnected = await testConnection()
    console.log("🔍 [DEBUG-AUTH] Database connected:", databaseConnected)

    let tablesExist: string[] = []
    let userCount = 0
    let sessionCount = 0
    let ownerAccount = { exists: false, details: undefined }
    const testResults = { passwordHash: false, loginFlow: false }

    if (databaseConnected) {
      try {
        // Check which tables exist
        const tableCheck = await sql`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('users', 'sessions', 'recipes')
        `
        tablesExist = tableCheck.map((row: any) => row.table_name)
        console.log("🔍 [DEBUG-AUTH] Tables found:", tablesExist)

        // Get user count
        if (tablesExist.includes("users")) {
          const userCountResult = await sql`SELECT COUNT(*) as count FROM users`
          userCount = Number.parseInt(userCountResult[0].count)
          console.log("🔍 [DEBUG-AUTH] User count:", userCount)

          // Check for owner account
          const ownerUser = await findUserByEmail("aaronhirshka@gmail.com")
          if (ownerUser) {
            ownerAccount = {
              exists: true,
              details: {
                id: ownerUser.id,
                username: ownerUser.username,
                email: ownerUser.email,
                role: ownerUser.role,
                status: ownerUser.status,
                is_verified: ownerUser.is_verified,
              },
            }
            console.log("🔍 [DEBUG-AUTH] Owner account found:", ownerUser.username)

            // Test password hashing
            try {
              const testPassword = "Morton2121"
              const isValidPassword = await bcrypt.compare(testPassword, ownerUser.password_hash)
              testResults.passwordHash = isValidPassword
              console.log("🔍 [DEBUG-AUTH] Password hash test:", isValidPassword ? "PASS" : "FAIL")
            } catch (error) {
              console.error("🔍 [DEBUG-AUTH] Password hash test error:", error)
              testResults.passwordHash = false
            }
          } else {
            console.log("🔍 [DEBUG-AUTH] Owner account not found")
          }
        }

        // Get session count
        if (tablesExist.includes("sessions")) {
          const sessionCountResult = await sql`SELECT COUNT(*) as count FROM sessions WHERE expires > NOW()`
          sessionCount = Number.parseInt(sessionCountResult[0].count)
          console.log("🔍 [DEBUG-AUTH] Active session count:", sessionCount)
        }
      } catch (error) {
        console.error("🔍 [DEBUG-AUTH] Error checking database details:", error)
      }
    }

    const debugData = {
      databaseConnected,
      tablesExist,
      userCount,
      ownerAccount,
      sessionCount,
      testResults,
    }

    console.log("✅ [DEBUG-AUTH] Debug check completed successfully")

    return NextResponse.json({
      success: true,
      debug: debugData,
    })
  } catch (error) {
    console.error("❌ [DEBUG-AUTH] Debug check error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: null,
      },
      { status: 500 },
    )
  }
}
