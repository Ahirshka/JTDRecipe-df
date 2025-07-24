// Alternative email service providers
// Choose the one that best fits your needs

import nodemailer from "nodemailer"

// Option 1: Resend (Recommended for Next.js)
export class ResendProvider {
  private resend: any

  constructor() {
    const { Resend } = require("resend")
    this.resend = new Resend(process.env.RESEND_API_KEY)
  }

  async send(to: string, subject: string, html: string) {
    return await this.resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [to],
      subject,
      html,
    })
  }
}

// Option 2: SendGrid
export class SendGridProvider {
  private sgMail: any

  constructor() {
    const sgMail = require("@sendgrid/mail")
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    this.sgMail = sgMail
  }

  async send(to: string, subject: string, html: string) {
    const msg = {
      to,
      from: process.env.FROM_EMAIL,
      subject,
      html,
    }
    return await this.sgMail.send(msg)
  }
}

// Option 3: Nodemailer (SMTP)
export class SMTPProvider {
  private transporter: any

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async send(to: string, subject: string, html: string) {
    return await this.transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
    })
  }
}

// Option 4: Amazon SES
export class SESProvider {
  private ses: any

  constructor() {
    const AWS = require("aws-sdk")
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    })
    this.ses = new AWS.SES({ apiVersion: "2010-12-01" })
  }

  async send(to: string, subject: string, html: string) {
    const params = {
      Destination: { ToAddresses: [to] },
      Message: {
        Body: { Html: { Charset: "UTF-8", Data: html } },
        Subject: { Charset: "UTF-8", Data: subject },
      },
      Source: process.env.FROM_EMAIL,
    }
    return await this.ses.sendEmail(params).promise()
  }
}
