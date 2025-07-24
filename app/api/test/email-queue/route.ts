import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY not configured",
        },
        { status: 400 },
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Check recent emails to see if the service is working
    try {
      const { data, error } = await resend.emails.list({ limit: 5 })

      if (error) {
        return NextResponse.json({
          success: false,
          error: `Queue check failed: ${error.message}`,
          details: error,
        })
      }

      const emails = data?.data || []
      const recentEmails = emails.filter((email) => {
        const emailDate = new Date(email.created_at)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return emailDate > oneDayAgo
      })

      return NextResponse.json({
        success: true,
        message: "Email queue is operational",
        queue_status: {
          total_recent_emails: recentEmails.length,
          last_24_hours: recentEmails.length,
          recent_emails: recentEmails.map((email) => ({
            id: email.id,
            to: email.to,
            subject: email.subject,
            status: email.last_event,
            created_at: email.created_at,
          })),
          service_operational: true,
        },
      })
    } catch (apiError: any) {
      return NextResponse.json({
        success: false,
        error: `Queue status check failed: ${apiError.message}`,
        details: apiError,
      })
    }
  } catch (error: any) {
    console.error("Email queue test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Queue test failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
