import { type NextRequest, NextResponse } from "next/server"
import { testConnection, findUserByEmail, getAllUsers, createOwnerAccount, OWNER_CONFIG } from "@/lib/neon"
import { getCurrentSession } from "@/lib/auth-system"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  console.log("🔍 [DEBUG-AUTH] Starting comprehensive auth debug")

  const debugResults = {
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      error: null as string | null,
    },
    owner: {
      exists: false,
      details: null as any,
      passwordTest: false,
    },
    session: {
      valid: false,
      user: null as any,
      error: null as string | null,
    },
    users: {
      total: 0,
      list: [] as any[],
    },
    environment: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    },
  }

  try {
    // Test database connection
    console.log("🔍 [DEBUG-AUTH] Testing database connection...")
    debugResults.database.connected = await testConnection()

    if (!debugResults.database.connected) {
      debugResults.database.error = "Connection failed"
      console.log("❌ [DEBUG-AUTH] Database connection failed")
    } else {
      console.log("✅ [DEBUG-AUTH] Database connected")
    }

    // Check owner account
    if (debugResults.database.connected) {
      console.log("🔍 [DEBUG-AUTH] Checking owner account...")
      const ownerUser = await findUserByEmail(OWNER_CONFIG.email)

      if (ownerUser) {
        debugResults.owner.exists = true
        debugResults.owner.details = {
          id: ownerUser.id,
          username: ownerUser.username,
          email: ownerUser.email,
          role: ownerUser.role,
          status: ownerUser.status,
          is_verified: ownerUser.is_verified,
          created_at: ownerUser.created_at,
          hasPasswordHash: !!ownerUser.password_hash,
        }

        // Test password
        if (ownerUser.password_hash) {
          debugResults.owner.passwordTest = await bcrypt.compare(OWNER_CONFIG.password, ownerUser.password_hash)
        }

        console.log("✅ [DEBUG-AUTH] Owner account found:", {
          username: ownerUser.username,
          passwordValid: debugResults.owner.passwordTest,
        })
      } else {
        console.log("❌ [DEBUG-AUTH] Owner account not found")
      }

      // Get all users
      console.log("🔍 [DEBUG-AUTH] Getting all users...")
      const allUsers = await getAllUsers()
      debugResults.users.total = allUsers.length
      debugResults.users.list = allUsers.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        created_at: user.created_at,
      }))

      console.log(`✅ [DEBUG-AUTH] Found ${allUsers.length} users`)
    }

    // Check current session
    console.log("🔍 [DEBUG-AUTH] Checking current session...")
    try {
      const sessionResult = await getCurrentSession()
      debugResults.session.valid = sessionResult.success

      if (sessionResult.success && sessionResult.user) {
        debugResults.session.user = {
          id: sessionResult.user.id,
          username: sessionResult.user.username,
          email: sessionResult.user.email,
          role: sessionResult.user.role,
        }
        console.log("✅ [DEBUG-AUTH] Valid session found for:", sessionResult.user.username)
      } else {
        debugResults.session.error = sessionResult.error || "No valid session"
        console.log("❌ [DEBUG-AUTH] No valid session")
      }
    } catch (sessionError) {
      debugResults.session.error = sessionError instanceof Error ? sessionError.message : "Session check failed"
      console.log("❌ [DEBUG-AUTH] Session check error:", sessionError)
    }

    console.log("✅ [DEBUG-AUTH] Debug complete")

    return NextResponse.json({
      success: true,
      debug: debugResults,
    })
  } catch (error) {
    console.error("❌ [DEBUG-AUTH] Debug error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        debug: debugResults,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  console.log("🔄 [DEBUG-AUTH] Creating owner account via debug endpoint")

  try {
    const result = await createOwnerAccount()

    if (result.success) {
      console.log("✅ [DEBUG-AUTH] Owner account created successfully")
      return NextResponse.json({
        success: true,
        message: "Owner account created successfully",
        user: result.user,
        credentials: result.credentials,
      })
    } else {
      console.log("❌ [DEBUG-AUTH] Owner account creation failed:", result.error)
      return NextResponse.json(
        {
          success: false,
          message: "Owner account creation failed",
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ [DEBUG-AUTH] Owner account creation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Owner account creation failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
