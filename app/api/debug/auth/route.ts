import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { hashPassword, verifyPassword, findUserByEmail, loginUser } from "@/lib/auth-system"

export async function GET(request: NextRequest) {
  console.log("🔍 [API-DEBUG-AUTH] Authentication debug request")

  const debugResults = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
  }

  try {
    // Test 1: Database Connection
    console.log("🔍 [DEBUG] Testing database connection...")
    try {
      const result = await sql`SELECT NOW() as current_time`
      debugResults.tests.push({
        name: "Database Connection",
        status: "✅ PASS",
        details: `Connected successfully. Current time: ${result[0].current_time}`,
      })
    } catch (error) {
      debugResults.tests.push({
        name: "Database Connection",
        status: "❌ FAIL",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 2: Password Hashing
    console.log("🔍 [DEBUG] Testing password hashing...")
    try {
      const testPassword = "Morton2121"
      const hash = await hashPassword(testPassword)
      const isValid = await verifyPassword(testPassword, hash)

      debugResults.tests.push({
        name: "Password Hashing",
        status: isValid ? "✅ PASS" : "❌ FAIL",
        details: {
          testPassword,
          hashGenerated: !!hash,
          hashLength: hash.length,
          verificationResult: isValid,
        },
      })
    } catch (error) {
      debugResults.tests.push({
        name: "Password Hashing",
        status: "❌ FAIL",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 3: User Lookup
    console.log("🔍 [DEBUG] Testing user lookup...")
    try {
      const testEmail = "aaronhirshka@gmail.com"
      const user = await findUserByEmail(testEmail)

      debugResults.tests.push({
        name: "User Lookup",
        status: user ? "✅ PASS" : "⚠️ NO USER",
        details: user
          ? {
              userId: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status,
              isVerified: user.is_verified,
            }
          : `No user found with email: ${testEmail}`,
      })
    } catch (error) {
      debugResults.tests.push({
        name: "User Lookup",
        status: "❌ FAIL",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 4: Full Login Process
    console.log("🔍 [DEBUG] Testing full login process...")
    try {
      const testEmail = "aaronhirshka@gmail.com"
      const testPassword = "Morton2121"
      const loginResult = await loginUser(testEmail, testPassword)

      debugResults.tests.push({
        name: "Full Login Process",
        status: loginResult.success ? "✅ PASS" : "❌ FAIL",
        details: loginResult.success
          ? {
              userId: loginResult.user?.id,
              username: loginResult.user?.username,
              sessionTokenGenerated: !!loginResult.sessionToken,
            }
          : {
              error: loginResult.error,
              details: loginResult.details,
            },
      })
    } catch (error) {
      debugResults.tests.push({
        name: "Full Login Process",
        status: "❌ FAIL",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Test 5: Users Table Status
    console.log("🔍 [DEBUG] Checking users table...")
    try {
      const users = await sql`
        SELECT id, username, email, role, status, is_verified, created_at
        FROM users 
        ORDER BY created_at DESC
        LIMIT 10
      `

      debugResults.tests.push({
        name: "Users Table Status",
        status: "✅ PASS",
        details: {
          totalUsers: users.length,
          users: users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            status: u.status,
            isVerified: u.is_verified,
          })),
        },
      })
    } catch (error) {
      debugResults.tests.push({
        name: "Users Table Status",
        status: "❌ FAIL",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    console.log("✅ [API-DEBUG-AUTH] Debug completed")

    return NextResponse.json({
      success: true,
      debug: debugResults,
    })
  } catch (error) {
    console.error("❌ [API-DEBUG-AUTH] Server error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: debugResults,
      },
      { status: 500 },
    )
  }
}
