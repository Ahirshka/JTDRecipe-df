import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check if required email environment variables are configured
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.FROM_EMAIL

    const missingVars = []
    if (!resendApiKey) missingVars.push("RESEND_API_KEY")
    if (!fromEmail) missingVars.push("FROM_EMAIL")

    if (missingVars.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Email configuration incomplete",
        details: `Missing environment variables: ${missingVars.join(", ")}`,
        error: `Missing required variables: ${missingVars.join(", ")}`,
        duration: Date.now() - startTime,
      })
    }

    // Validate API key format
    if (!resendApiKey.startsWith("re_")) {
      return NextResponse.json({
        success: false,
        message: "Invalid Resend API key format",
        details: "RESEND_API_KEY must start with 're_' - get a valid key from resend.com/api-keys",
        error: "Invalid RESEND_API_KEY format",
        duration: Date.now() - startTime,
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(fromEmail)) {
      return NextResponse.json({
        success: false,
        message: "Invalid FROM_EMAIL format",
        details: "FROM_EMAIL must be a valid email address format",
        error: "Invalid FROM_EMAIL format",
        duration: Date.now() - startTime,
      })
    }

    // Test Resend API connection
    const resend = new Resend(resendApiKey)

    try {
      // Test API key by attempting to get domains (this doesn't send an email)
      const domains = await resend.domains.list()

      // Check if the FROM_EMAIL domain is verified
      const fromDomain = fromEmail.split("@")[1]
      const verifiedDomains = domains.data?.map((d) => d.name) || []

      if (verifiedDomains.length === 0) {
        return NextResponse.json({
          success: false,
          message: "No verified domains in Resend",
          details: `You need to verify the domain '${fromDomain}' in your Resend dashboard before sending emails`,
          error: "No verified domains found",
          duration: Date.now() - startTime,
        })
      }

      const isDomainVerified = verifiedDomains.includes(fromDomain)

      if (!isDomainVerified) {
        return NextResponse.json({
          success: false,
          message: "FROM_EMAIL domain not verified",
          details: `Domain '${fromDomain}' is not verified in Resend. Verified domains: ${verifiedDomains.join(", ")}`,
          error: `Domain '${fromDomain}' not verified in Resend`,
          duration: Date.now() - startTime,
        })
      }

      return NextResponse.json({
        success: true,
        message: "Email service configured correctly",
        details: `Resend API connected successfully. Domain '${fromDomain}' is verified. FROM_EMAIL: ${fromEmail}`,
        duration: Date.now() - startTime,
      })
    } catch (resendError) {
      console.error("Resend API error:", resendError)

      let errorMessage = "Resend API error"
      let errorDetails = "Unable to connect to Resend API"

      if (resendError instanceof Error) {
        errorMessage = resendError.message

        if (resendError.message.includes("Invalid API key")) {
          errorDetails = "Invalid RESEND_API_KEY. Get a valid API key from resend.com/api-keys"
        } else if (resendError.message.includes("Unauthorized")) {
          errorDetails = "Unauthorized access to Resend API. Check your API key permissions."
        } else if (resendError.message.includes("rate limit")) {
          errorDetails = "Resend API rate limit exceeded. Try again later."
        } else {
          errorDetails = `Resend API error: ${resendError.message}`
        }
      }

      return NextResponse.json({
        success: false,
        message: "Email service connection failed",
        details: errorDetails,
        error: errorMessage,
        duration: Date.now() - startTime,
      })
    }
  } catch (error) {
    console.error("Email test error:", error)

    return NextResponse.json({
      success: false,
      message: "Email test failed",
      details: "An unexpected error occurred while testing email configuration",
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    })
  }
}
