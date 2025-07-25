import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  console.log("🔍 [DEBUG-OWNER] Starting owner login debug process...")

  try {
    const body = await request.json()
    const testEmail = body.email || "aaronhirshka@gmail.com"
    const testPassword = body.password || "Morton2121"

    console.log(`🔍 [DEBUG-OWNER] Testing login for: ${testEmail}`)
    console.log(`🔍 [DEBUG-OWNER] Testing password: ${testPassword}`)

    const debugResults = {
      step1_user_lookup: null as any,
      step2_password_verification: null as any,
      step3_session_creation: null as any,
      final_result: null as any,
    }

    // Step 1: Find user by email
    console.log("📋 [DEBUG-OWNER] Step 1: Looking up user by email...")
    try {
      const user = await findUserByEmail(testEmail)
      debugResults.step1_user_lookup = {
        success: !!user,
        user_found: !!user,
        user_details: user
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status,
              is_verified: user.is_verified,
              has_password: !!user.password,
              password_length: user.password ? user.password.length : 0,
              password_starts_with: user.password ? user.password.substring(0, 10) : "N/A",
              created_at: user.created_at,
            }
          : null,
      }

      if (!user) {
        debugResults.final_result = {
          success: false,
          error: "User not found",
          details: "No user exists with this email address",
        }
        return NextResponse.json({ debug: debugResults })
      }

      // Step 2: Test password verification
      console.log("🔐 [DEBUG-OWNER] Step 2: Testing password verification...")
      try {
        // Test bcrypt directly
        const directBcryptTest = await bcrypt.compare(testPassword, user.password)
        console.log(`🔍 [DEBUG-OWNER] Direct bcrypt test result: ${directBcryptTest}`)

        // Test our verification function
        const functionTest = await verifyUserPassword(user, testPassword)
        console.log(`🔍 [DEBUG-OWNER] Function test result: ${functionTest}`)

        debugResults.step2_password_verification = {
          success: functionTest,
          direct_bcrypt_result: directBcryptTest,
          function_result: functionTest,
          input_password: testPassword,
          stored_hash: user.password.substring(0, 20) + "...",
          hash_length: user.password.length,
          bcrypt_rounds: user.password.startsWith("$2b$") ? "bcrypt format detected" : "unknown format",
        }

        if (!functionTest) {
          debugResults.final_result = {
            success: false,
            error: "Password verification failed",
            details: "The password does not match the stored hash",
          }
          return NextResponse.json({ debug: debugResults })
        }

        // Step 3: Test session creation
        console.log("🎫 [DEBUG-OWNER] Step 3: Testing session creation...")
        try {
          const session = await createSession(user.id)
          debugResults.step3_session_creation = {
            success: !!session,
            session_created: !!session,
            token_length: session ? session.token.length : 0,
            expires: session ? session.expires.toISOString() : null,
          }

          if (!session) {
            debugResults.final_result = {
              success: false,
              error: "Session creation failed",
              details: "Unable to create session for user",
            }
            return NextResponse.json({ debug: debugResults })
          }

          // Final success
          debugResults.final_result = {
            success: true,
            message: "Owner login debug completed successfully",
            login_would_succeed: true,
          }

          console.log("✅ [DEBUG-OWNER] All steps completed successfully!")
        } catch (sessionError) {
          console.error("❌ [DEBUG-OWNER] Session creation error:", sessionError)
          debugResults.step3_session_creation = {
            success: false,
            error: sessionError instanceof Error ? sessionError.message : "Unknown session error",
          }
          debugResults.final_result = {
            success: false,
            error: "Session creation failed",
            details: sessionError instanceof Error ? sessionError.message : "Unknown error",
          }
        }
      } catch (passwordError) {
        console.error("❌ [DEBUG-OWNER] Password verification error:", passwordError)
        debugResults.step2_password_verification = {
          success: false,
          error: passwordError instanceof Error ? passwordError.message : "Unknown password error",
        }
        debugResults.final_result = {
          success: false,
          error: "Password verification failed",
          details: passwordError instanceof Error ? passwordError.message : "Unknown error",
        }
      }
    } catch (userError) {
      console.error("❌ [DEBUG-OWNER] User lookup error:", userError)
      debugResults.step1_user_lookup = {
        success: false,
        error: userError instanceof Error ? userError.message : "Unknown user lookup error",
      }
      debugResults.final_result = {
        success: false,
        error: "User lookup failed",
        details: userError instanceof Error ? userError.message : "Unknown error",
      }
    }

    return NextResponse.json({
      debug: debugResults,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [DEBUG-OWNER] Debug process error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Debug process failed",
        details: error instanceof Error ? error.message : "Unknown error",
        debug: {
          error_occurred_at: "debug_process_start",
          error_details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Owner login debug endpoint",
    usage: "POST with { email, password } to debug login process",
    default_credentials: {
      email: "aaronhirshka@gmail.com",
      password: "Morton2121",
    },
  })
}
