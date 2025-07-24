import { NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const { type, recipient } = await request.json()

    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient email is required",
        },
        { status: 400 },
      )
    }

    const testUsername = `testuser-${nanoid(6)}`
    const testToken = nanoid(32)
    let emailSent = false
    let emailType = ""

    switch (type) {
      case "verification":
        emailSent = await emailService.sendVerificationEmail(recipient, testUsername, testToken)
        emailType = "Email Verification"
        break

      case "password_reset":
        emailSent = await emailService.sendPasswordResetEmail(recipient, testUsername, testToken)
        emailType = "Password Reset"
        break

      case "welcome":
        emailSent = await emailService.sendWelcomeEmail(recipient, testUsername)
        emailType = "Welcome Email"
        break

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email type. Use: verification, password_reset, or welcome",
          },
          { status: 400 },
        )
    }

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: `${emailType} sent successfully to ${recipient}`,
        details: {
          type: emailType,
          recipient,
          test_username: testUsername,
          test_token: type !== "welcome" ? testToken.substring(0, 8) + "..." : undefined,
          sent_at: new Date().toISOString(),
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to send ${emailType.toLowerCase()}`,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Send email test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Email sending failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
