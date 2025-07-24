import { NextResponse } from "next/server"

export async function GET() {
  try {
    const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const url = new URL(domain)

    if (url.hostname.startsWith("www.")) {
      // Test non-www redirect
      const nonWwwUrl = domain.replace("www.", "")
      const response = await fetch(nonWwwUrl, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": "JustTheDamnRecipe-RedirectCheck/1.0" },
      })

      const isRedirect = response.status >= 300 && response.status < 400

      return NextResponse.json({
        success: true,
        message: isRedirect ? "Redirect is configured" : "No redirect configured",
        details: `Non-www to www redirect ${isRedirect ? "active" : "not active"}`,
        status: response.status,
        location: response.headers.get("location"),
      })
    } else {
      // Test www redirect
      const wwwUrl = domain.replace("://", "://www.")
      const response = await fetch(wwwUrl, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": "JustTheDamnRecipe-RedirectCheck/1.0" },
      })

      const isRedirect = response.status >= 300 && response.status < 400

      return NextResponse.json({
        success: true,
        message: isRedirect ? "Redirect is configured" : "No redirect configured",
        details: `WWW to non-www redirect ${isRedirect ? "active" : "not active"}`,
        status: response.status,
        location: response.headers.get("location"),
      })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Redirect test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
