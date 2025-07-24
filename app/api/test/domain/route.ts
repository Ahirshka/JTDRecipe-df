import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const domain = "www.justthedamnrecipe.net"
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${domain}`

    // Test 1: Check if domain resolves
    try {
      const response = await fetch(`https://${domain}`, {
        method: "HEAD",
        headers: {
          "User-Agent": "JTDRecipe-HealthCheck/1.0",
        },
      })

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          message: "Domain not accessible",
          details: `${domain} returned status ${response.status}. Check DNS configuration and Vercel deployment.`,
          error: `HTTP ${response.status}: ${response.statusText}`,
          duration: Date.now() - startTime,
        })
      }

      // Test 2: Check if it's serving our application
      try {
        const healthResponse = await fetch(`https://${domain}/api/health`, {
          method: "GET",
          headers: {
            "User-Agent": "JTDRecipe-HealthCheck/1.0",
          },
        })

        if (healthResponse.ok) {
          const healthData = await healthResponse.json()

          return NextResponse.json({
            success: true,
            message: "Domain and application accessible",
            details: `${domain} is properly configured and serving the application. SSL certificate is valid.`,
            duration: Date.now() - startTime,
          })
        } else {
          return NextResponse.json({
            success: false,
            message: "Domain accessible but app not responding",
            details: `${domain} loads but the application health check failed. This might indicate deployment issues.`,
            error: `Health check failed: HTTP ${healthResponse.status}`,
            duration: Date.now() - startTime,
          })
        }
      } catch (healthError) {
        // If health endpoint doesn't exist, that's okay - domain is still accessible
        return NextResponse.json({
          success: true,
          message: "Domain accessible",
          details: `${domain} is accessible with valid SSL, but health endpoint not available. This is normal.`,
          duration: Date.now() - startTime,
        })
      }
    } catch (domainError) {
      console.error("Domain test error:", domainError)

      let errorMessage = "Domain connection failed"
      let errorDetails = `Unable to connect to ${domain}`

      if (domainError instanceof Error) {
        errorMessage = domainError.message

        if (domainError.message.includes("ENOTFOUND")) {
          errorDetails = `DNS resolution failed for ${domain}. Check your DNS configuration.`
        } else if (domainError.message.includes("ECONNREFUSED")) {
          errorDetails = `Connection refused by ${domain}. Check if the server is running.`
        } else if (domainError.message.includes("certificate")) {
          errorDetails = `SSL certificate error for ${domain}. Check your SSL configuration.`
        } else if (domainError.message.includes("timeout")) {
          errorDetails = `Connection timeout to ${domain}. Check server availability.`
        } else {
          errorDetails = `Domain error: ${domainError.message}`
        }
      }

      return NextResponse.json({
        success: false,
        message: "Domain connection failed",
        details: errorDetails,
        error: errorMessage,
        duration: Date.now() - startTime,
      })
    }
  } catch (error) {
    console.error("Domain test error:", error)

    return NextResponse.json({
      success: false,
      message: "Domain test failed",
      details: "An unexpected error occurred while testing domain connectivity",
      error: error instanceof Error ? error.message : "Unknown error",
      duration: Date.now() - startTime,
    })
  }
}
