interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface EmailServiceConfig {
  apiKey?: string
  fromEmail: string
  appUrl: string
}

class EmailService {
  private config: EmailServiceConfig
  private resend: any = null

  constructor() {
    this.config = {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: process.env.FROM_EMAIL || "noreply@justthedamnrecipe.net",
      appUrl:
        process.env.NEXT_PUBLIC_APP_URL || "https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app",
    }
  }

  private async getResend() {
    if (!this.resend && this.config.apiKey) {
      try {
        const { Resend } = await import("resend")
        this.resend = new Resend(this.config.apiKey)
      } catch (error) {
        console.error("Failed to initialize Resend:", error)
        return null
      }
    }
    return this.resend
  }

  private getVerificationEmailTemplate(username: string, token: string): EmailTemplate {
    const verificationUrl = `${this.config.appUrl}/verify-email?token=${token}`

    return {
      subject: "Verify your email - Just The Damn Recipe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Just The Damn Recipe!</h1>
          <p>Hi ${username},</p>
          <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
        Welcome to Just The Damn Recipe!
        
        Hi ${username},
        
        Thanks for signing up! Please verify your email address by visiting:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
      `,
    }
  }

  private getPasswordResetEmailTemplate(username: string, token: string): EmailTemplate {
    const resetUrl = `${this.config.appUrl}/reset-password?token=${token}`

    return {
      subject: "Reset your password - Just The Damn Recipe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>Hi ${username},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hi ${username},
        
        We received a request to reset your password. Visit this link to create a new password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email.
      `,
    }
  }

  private getWelcomeEmailTemplate(username: string): EmailTemplate {
    return {
      subject: "Welcome to Just The Damn Recipe!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to Just The Damn Recipe!</h1>
          <p>Hi ${username},</p>
          <p>Your email has been verified and your account is now active!</p>
          <p>You can now:</p>
          <ul>
            <li>Browse thousands of recipes</li>
            <li>Save your favorite recipes</li>
            <li>Submit your own recipes</li>
            <li>Rate and review recipes</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.config.appUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Start Cooking!
            </a>
          </div>
          <p>Happy cooking!</p>
          <p>The Just The Damn Recipe Team</p>
        </div>
      `,
      text: `
        Welcome to Just The Damn Recipe!
        
        Hi ${username},
        
        Your email has been verified and your account is now active!
        
        You can now:
        - Browse thousands of recipes
        - Save your favorite recipes
        - Submit your own recipes
        - Rate and review recipes
        
        Visit: ${this.config.appUrl}
        
        Happy cooking!
        The Just The Damn Recipe Team
      `,
    }
  }

  async sendVerificationEmail(email: string, username: string, token: string): Promise<boolean> {
    try {
      const resend = await this.getResend()
      if (!resend) {
        console.error("Resend not configured, skipping email")
        return false
      }

      const template = this.getVerificationEmailTemplate(username, token)

      const result = await resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      console.log("Verification email sent:", result)
      return true
    } catch (error) {
      console.error("Failed to send verification email:", error)
      return false
    }
  }

  async sendPasswordResetEmail(email: string, username: string, token: string): Promise<boolean> {
    try {
      const resend = await this.getResend()
      if (!resend) {
        console.error("Resend not configured, skipping email")
        return false
      }

      const template = this.getPasswordResetEmailTemplate(username, token)

      const result = await resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      console.log("Password reset email sent:", result)
      return true
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      return false
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      const resend = await this.getResend()
      if (!resend) {
        console.error("Resend not configured, skipping email")
        return false
      }

      const template = this.getWelcomeEmailTemplate(username)

      const result = await resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      console.log("Welcome email sent:", result)
      return true
    } catch (error) {
      console.error("Failed to send welcome email:", error)
      return false
    }
  }

  async sendTestEmail(email: string): Promise<boolean> {
    try {
      const resend = await this.getResend()
      if (!resend) {
        console.error("Resend not configured, skipping email")
        return false
      }

      const result = await resend.emails.send({
        from: this.config.fromEmail,
        to: email,
        subject: "Test Email - Just The Damn Recipe",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Email Test Successful!</h1>
            <p>This is a test email from Just The Damn Recipe.</p>
            <p>If you received this email, your email configuration is working correctly.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
        text: `
          Email Test Successful!
          
          This is a test email from Just The Damn Recipe.
          If you received this email, your email configuration is working correctly.
          
          Timestamp: ${new Date().toISOString()}
        `,
      })

      console.log("Test email sent:", result)
      return true
    } catch (error) {
      console.error("Failed to send test email:", error)
      return false
    }
  }

  getConfiguration() {
    return {
      hasApiKey: !!this.config.apiKey,
      fromEmail: this.config.fromEmail,
      appUrl: this.config.appUrl,
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()
