import { NextResponse } from "next/server"

export async function GET() {
  try {
    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const url = new URL(domain)

    if (url.protocol === "https:") {
      // Test HTTPS connection
      const response = await fetch(domain, {
        method: "HEAD",
        headers: { "User-Agent": "JustTheDamnRecipe-SSLCheck/1.0" },
      })

      return NextResponse.json({
        success: response.ok,
        message: response.ok ? "SSL certificate is valid" : "SSL certificate issue",
        details: `HTTPS connection ${response.ok ? "successful" : "failed"}`,
        protocol: url.protocol,
        hostname: url.hostname,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "SSL not configured",
        details: "Domain is using HTTP instead of HTTPS",
        protocol: url.protocol,
        hostname: url.hostname,
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "SSL test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
