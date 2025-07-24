import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const { to, subject, content } = await request.json()

    if (!to || !subject || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: to, subject, content",
        },
        { status: 400 },
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "RESEND_API_KEY not configured",
        },
        { status: 500 },
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.FROM_EMAIL || "noreply@justthedamnrecipe.net"

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html: content,
    })

    if (error) {
      console.error("Custom email sending error:", error)
      return NextResponse.json(
        {
          success: false,
          error: `Email sending failed: ${error.message}`,
          details: error,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Custom email sent successfully to ${to}`,
      details: {
        recipient: to,
        subject,
        from: fromEmail,
        email_id: data?.id,
        sent_at: new Date().toISOString(),
        content_length: content.length,
      },
    })
  } catch (error: any) {
    console.error("Custom email test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Custom email failed: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
