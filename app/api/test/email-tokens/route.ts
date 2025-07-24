import { NextResponse } from "next/server"
import { emailTokenService } from "@/lib/email-tokens"
import { nanoid } from "nanoid"

export async function GET() {
  try {
    const testUserId = `test-user-${nanoid(8)}`
    const results = []

    // Test email verification token creation
    try {
      const verificationToken = await emailTokenService.createEmailVerificationToken(testUserId)
      results.push({
        type: "email_verification",
        status: "success",
        token_length: verificationToken.length,
        token_preview: verificationToken.substring(0, 8) + "...",
      })

      // Test token verification
      const verification = await emailTokenService.verifyToken(verificationToken, "email_verification")
      results.push({
        type: "token_verification",
        status: verification.valid ? "success" : "error",
        valid: verification.valid,
        user_id_match: verification.userId === testUserId,
        error: verification.error,
      })
    } catch (error: any) {
      results.push({
        type: "email_verification",
        status: "error",
        error: error.message,
      })
    }

    // Test password reset token creation
    try {
      const resetToken = await emailTokenService.createPasswordResetToken(testUserId)
      results.push({
        type: "password_reset",
        status: "success",
        token_length: resetToken.length,
        token_preview: resetToken.substring(0, 8) + "...",
      })

      // Test token verification
      const verification = await emailTokenService.verifyToken(resetToken, "password_reset")
      results.push({
        type: "reset_verification",
        status: verification.valid ? "success" : "error",
        valid: verification.valid,
        user_id_match: verification.userId === testUserId,
        error: verification.error,
      })
    } catch (error: any) {
      results.push({
        type: "password_reset",
        status: "error",
        error: error.message,
      })
    }

    // Test token cleanup
    try {
      await emailTokenService.cleanupExpiredTokens()
      results.push({
        type: "token_cleanup",
        status: "success",
        message: "Cleanup completed successfully",
      })
    } catch (error: any) {
      results.push({
        type: "token_cleanup",
        status: "error",
        error: error.message,
      })
    }

    const successCount = results.filter((r) => r.status === "success").length
    const errorCount = results.filter((r) => r.status === "error").length

    return NextResponse.json({
      success: errorCount === 0,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: errorCount,
      },
      test_user_id: testUserId,
    })
  } catch (error: any) {
    console.error("Email token test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Token test failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
