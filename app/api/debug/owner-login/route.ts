import { type NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyUserPassword, createSession } from "@/lib/neon"
import bcrypt from "bcryptjs"

interface DebugStep {
  step: number
  name: string
  status: "pending" | "success" | "error"
  message: string
  data?: any
  error?: string
}

export async function POST(request: NextRequest) {
  console.log("🔍 [DEBUG-OWNER] Starting owner login debug process...")

  const steps: DebugStep[] = []
  let currentStep = 1

  try {
    const body = await request.json()
    const testEmail = body.email || "aaronhirshka@gmail.com"
    const testPassword = body.password || "Morton2121"

    console.log(`🔍 [DEBUG-OWNER] Testing login for: ${testEmail}`)
    console.log(`🔍 [DEBUG-OWNER] Testing password: ${testPassword}`)

    // Step 1: Validate Input
    steps.push({
      step: currentStep++,
      name: "Validate Input",
      status: "pending",
      message: "Checking if email and password are provided",
    })

    if (!testEmail || !testPassword) {
      steps[steps.length - 1].status = "error"
      steps[steps.length - 1].message = "Missing email or password"
      steps[steps.length - 1].error = "Both email and password are required"

      return NextResponse.json({
        success: false,
        steps,
        summary: "Debug failed: Missing required credentials",
        loginWorking: false,
      })
    }

    steps[steps.length - 1].status = "success"
    steps[steps.length - 1].message = "Email and password provided"
    steps[steps.length - 1].data = { email: testEmail, passwordLength: testPassword.length }

    // Step 2: Database Connection Test
    steps.push({
      step: currentStep++,
      name: "Database Connection",
      status: "pending",
      message: "Testing database connection",
    })

    try {
      const { sql } = await import("@/lib/neon")
      const testQuery = await sql`SELECT 1 as test;`

      steps[steps.length - 1].status = "success"
      steps[steps.length - 1].message = "Database connection successful"
      steps[steps.length - 1].data = { testResult: testQuery[0] }
    } catch (dbError) {
      steps[steps.length - 1].status = "error"
      steps[steps.length - 1].message = "Database connection failed"
      steps[steps.length - 1].error = dbError instanceof Error ? dbError.message : "Unknown database error"

      return NextResponse.json({
        success: false,
        steps,
        summary: "Debug failed: Cannot connect to database",
        loginWorking: false,
      })
    }

    // Step 3: Find user by email
    console.log("📋 [DEBUG-OWNER] Step 1: Looking up user by email...")
    steps.push({
      step: currentStep++,
      name: "Find User by Email",
      status: "pending",
      message: `Looking up user with email: ${testEmail}`,
    })

    let user: any
    try {
      user = await findUserByEmail(testEmail)

      if (!user) {
        steps[steps.length - 1].status = "error"
        steps[steps.length - 1].message = "User not found in database"
        steps[steps.length - 1].error = `No user found with email: ${testEmail}`

        return NextResponse.json({
          success: false,
          steps,
          summary: "Debug failed: User account does not exist",
          loginWorking: false,
        })
      }

      steps[steps.length - 1].status = "success"
      steps[steps.length - 1].message = "User found in database"
      steps[steps.length - 1].data = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
        passwordHashLength: user.password ? user.password.length : 0,
        passwordHashStart: user.password ? user.password.substring(0, 10) : "N/A",
      }
    } catch (userError) {
      steps[steps.length - 1].status = "error"
      steps[steps.length - 1].message = "Error finding user"
      steps[steps.length - 1].error = userError instanceof Error ? userError.message : "Unknown user lookup error"

      return NextResponse.json({
        success: false,
        steps,
        summary: "Debug failed: Error during user lookup",
        loginWorking: false,
      })
    }

    // Step 4: Direct bcrypt Test
    steps.push({
      step: currentStep++,
      name: "Direct bcrypt Test",
      status: "pending",
      message: "Testing password hash directly with bcrypt",
    })

    try {
      const directBcryptTest = await bcrypt.compare(testPassword, user.password)

      steps[steps.length - 1].status = directBcryptTest ? "success" : "error"
      steps[steps.length - 1].message = directBcryptTest
        ? "Direct bcrypt comparison successful"
        : "Direct bcrypt comparison failed"
      steps[steps.length - 1].data = {
        inputPassword: testPassword,
        storedHashStart: user.password.substring(0, 20),
        bcryptResult: directBcryptTest,
      }

      if (!directBcryptTest) {
        steps[steps.length - 1].error = "Password does not match stored hash"
      }
    } catch (bcryptError) {
      steps[steps.length - 1].status = "error"
      steps[steps.length - 1].message = "bcrypt comparison error"
      steps[steps.length - 1].error = bcryptError instanceof Error ? bcryptError.message : "Unknown bcrypt error"
    }

    // Step 5: Test password verification
    console.log("🔐 [DEBUG-OWNER] Step 2: Testing password verification...")
    steps.push({
      step: currentStep++,
      name: "Password Verification Function",
      status: "pending",
      message: "Testing our password verification function",
    })

    let passwordValid = false
    try {
      passwordValid = await verifyUserPassword(user, testPassword)

      steps[steps.length - 1].status = passwordValid ? "success" : "error"
      steps[steps.length - 1].message = passwordValid
        ? "Password verification function successful"
        : "Password verification function failed"
      steps[steps.length - 1].data = {
        verificationResult: passwordValid,
        functionUsed: "verifyUserPassword",
      }

      if (!passwordValid) {
        steps[steps.length - 1].error = "Our verification function returned false"
      }
    } catch (verifyError) {
      steps[steps.length - 1].status = "error"
      steps[steps.length - 1].message = "Password verification function error"
      steps[steps.length - 1].error = verifyError instanceof Error ? verifyError.message : "Unknown verification error"
    }

    // Step 6: Test session creation
    console.log("🎫 [DEBUG-OWNER] Step 3: Testing session creation...")
    steps.push({
      step: currentStep++,
      name: "Session Creation Test",
      status: "pending",
      message: "Testing session creation",
    })

    if (passwordValid) {
      try {
        const session = await createSession(user.id)

        if (session) {
          steps[steps.length - 1].status = "success"
          steps[steps.length - 1].message = "Session created successfully"
          steps[steps.length - 1].data = {
            tokenLength: session.token.length,
            tokenStart: session.token.substring(0, 10),
            expires: session.expires,
          }
        } else {
          steps[steps.length - 1].status = "error"
          steps[steps.length - 1].message = "Session creation returned null"
          steps[steps.length - 1].error = "createSession function returned null"
        }
      } catch (sessionError) {
        steps[steps.length - 1].status = "error"
        steps[steps.length - 1].message = "Session creation error"
        steps[steps.length - 1].error = sessionError instanceof Error ? sessionError.message : "Unknown session error"
      }
    } else {
      steps[steps.length - 1].status = "error"
      steps[steps.length - 1].message = "Skipped due to password verification failure"
      steps[steps.length - 1].error = "Cannot test session creation with invalid password"
    }

    // Determine overall result
    const allStepsSuccessful = steps.every((step) => step.status === "success")
    const loginWorking = allStepsSuccessful && passwordValid

    let summary: string
    if (loginWorking) {
      summary = "All login steps completed successfully. Owner login should work."
    } else {
      const failedSteps = steps.filter((step) => step.status === "error")
      summary = `Login has issues. Failed steps: ${failedSteps.map((s) => s.name).join(", ")}`
    }

    console.log("✅ [DEBUG-OWNER] All steps completed successfully!")
    console.log("🐛 [DEBUG-API] Debug process complete:", {
      totalSteps: steps.length,
      successfulSteps: steps.filter((s) => s.status === "success").length,
      loginWorking,
    })

    return NextResponse.json({
      success: true,
      steps,
      summary,
      loginWorking,
      debugInfo: {
        email: testEmail,
        userFound: !!user,
        passwordValid,
        totalSteps: steps.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("❌ [DEBUG-OWNER] Debug process error:", error)

    // Add error step
    steps.push({
      step: currentStep,
      name: "Debug Process Error",
      status: "error",
      message: "Unexpected error during debug process",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    })

    return NextResponse.json(
      {
        success: false,
        steps,
        summary: "Debug process failed due to unexpected error",
        loginWorking: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
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
