import { NextResponse } from "next/server"

export async function GET() {
  try {
    const domain = "www.justthedamnrecipe.net"
    const rootDomain = "justthedamnrecipe.net"

    // Test domain accessibility
    let accessible = false
    let ssl = false
    let redirects = false

    try {
      // Test main domain
      const mainResponse = await fetch(`https://${domain}`, {
        method: "HEAD",
        timeout: 10000,
      })
      accessible = mainResponse.ok
      ssl = true // If HTTPS works, SSL is valid
    } catch (error) {
      console.log("Main domain test failed:", error)
    }

    try {
      // Test root domain redirect to www
      const rootResponse = await fetch(`https://${rootDomain}`, {
        method: "HEAD",
        timeout: 10000,
        redirect: "manual",
      })
      redirects = rootResponse.status === 301 || rootResponse.status === 302
    } catch (error) {
      console.log("Root domain redirect test failed:", error)
    }

    // Mock DNS record status (in production, you'd use actual DNS lookup)
    const records = [
      {
        type: "A",
        name: "@",
        value: "76.76.19.61",
        ttl: 300,
        description: "Points your root domain to Vercel servers",
        status: accessible ? "valid" : "invalid",
      },
      {
        type: "CNAME",
        name: "www",
        value: "cname.vercel-dns.com",
        ttl: 300,
        description: "Points www subdomain to Vercel",
        status: accessible ? "valid" : "invalid",
      },
      {
        type: "MX",
        name: "@",
        value: "mx1.forwardemail.net",
        priority: 10,
        ttl: 300,
        description: "Primary email server for contact@justthedamnrecipe.net",
        status: "unknown",
      },
      {
        type: "MX",
        name: "@",
        value: "mx2.forwardemail.net",
        priority: 20,
        ttl: 300,
        description: "Secondary email server for contact@justthedamnrecipe.net",
        status: "unknown",
      },
      {
        type: "TXT",
        name: "@",
        value: "v=spf1 include:_spf.mx.cloudflare.net ~all",
        ttl: 300,
        description: "SPF record for email authentication",
        status: "unknown",
      },
      {
        type: "TXT",
        name: "_dmarc",
        value: "v=DMARC1; p=quarantine; rua=mailto:contact@justthedamnrecipe.net",
        ttl: 300,
        description: "DMARC policy for email security",
        status: "unknown",
      },
    ]

    return NextResponse.json({
      domain,
      accessible,
      ssl,
      redirects,
      records,
      lastChecked: new Date().toISOString(),
      status: accessible ? "online" : "offline",
      message: accessible
        ? "Domain is accessible and SSL is working"
        : "Domain is not accessible - check DNS configuration",
    })
  } catch (error) {
    console.error("DNS status check failed:", error)

    return NextResponse.json(
      {
        domain: "www.justthedamnrecipe.net",
        accessible: false,
        ssl: false,
        redirects: false,
        records: [],
        lastChecked: new Date().toISOString(),
        status: "error",
        message: "Failed to check DNS status",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
