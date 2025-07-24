import { NextResponse } from "next/server"

export async function GET() {
  try {
    const templates = []
    const testUser = {
      email: "test@example.com",
      username: "testuser",
    }
    const testToken = "test-token-123"

    // Test verification email template
    try {
      const verificationHtml = await generateVerificationTemplate(testUser.email, testUser.username, testToken)
      templates.push({
        name: "Email Verification",
        type: "verification",
        status: "success",
        preview: verificationHtml.substring(0, 200) + "...",
      })
    } catch (error: any) {
      templates.push({
        name: "Email Verification",
        type: "verification",
        status: "error",
        error: error.message,
      })
    }

    // Test password reset template
    try {
      const resetHtml = await generatePasswordResetTemplate(testUser.email, testUser.username, testToken)
      templates.push({
        name: "Password Reset",
        type: "password_reset",
        status: "success",
        preview: resetHtml.substring(0, 200) + "...",
      })
    } catch (error: any) {
      templates.push({
        name: "Password Reset",
        type: "password_reset",
        status: "error",
        error: error.message,
      })
    }

    // Test welcome email template
    try {
      const welcomeHtml = await generateWelcomeTemplate(testUser.email, testUser.username)
      templates.push({
        name: "Welcome Email",
        type: "welcome",
        status: "success",
        preview: welcomeHtml.substring(0, 200) + "...",
      })
    } catch (error: any) {
      templates.push({
        name: "Welcome Email",
        type: "welcome",
        status: "error",
        error: error.message,
      })
    }

    const successCount = templates.filter((t) => t.status === "success").length
    const errorCount = templates.filter((t) => t.status === "error").length

    return NextResponse.json({
      success: errorCount === 0,
      templates,
      summary: {
        total: templates.length,
        successful: successCount,
        failed: errorCount,
      },
    })
  } catch (error: any) {
    console.error("Template test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Template test failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}

// Helper functions to generate templates
async function generateVerificationTemplate(email: string, username: string, token: string): Promise<string> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - Just The Damn Recipe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍳 Just The Damn Recipe</h1>
          </div>
          <div class="content">
            <h2>Welcome ${username}!</h2>
            <p>Thanks for joining Just The Damn Recipe! To complete your registration, please verify your email address by clicking the button below:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Just The Damn Recipe. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

async function generatePasswordResetTemplate(email: string, username: string, token: string): Promise<string> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - Just The Damn Recipe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍳 Just The Damn Recipe</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${username},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you create a new one</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>© 2024 Just The Damn Recipe. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

async function generateWelcomeTemplate(email: string, username: string): Promise<string> {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Just The Damn Recipe!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #ea580c; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍳 Welcome to Just The Damn Recipe!</h1>
          </div>
          <div class="content">
            <h2>Hi ${username}! 👋</h2>
            <p>Welcome to the community! We're excited to have you join thousands of home cooks who are tired of life stories and just want the damn recipe.</p>
            
            <h3>What you can do now:</h3>
            
            <div class="feature">
              <h4>📖 Browse Recipes</h4>
              <p>Discover thousands of recipes without the fluff - just ingredients and instructions.</p>
            </div>
            
            <div class="feature">
              <h4>➕ Share Your Recipes</h4>
              <p>Add your favorite recipes and help others skip the stories.</p>
            </div>
            
            <div class="feature">
              <h4>❤️ Save Favorites</h4>
              <p>Build your personal recipe collection for quick access.</p>
            </div>
            
            <div class="feature">
              <h4>⭐ Rate & Review</h4>
              <p>Help the community by rating recipes and leaving helpful reviews.</p>
            </div>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Start Cooking!</a>
            </p>
            
            <p>Happy cooking!</p>
            <p>The Just The Damn Recipe Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Just The Damn Recipe. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
