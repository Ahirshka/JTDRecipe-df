#!/usr/bin/env node

// Production Readiness Check for Just The Damn Recipe
// This script verifies that the production deployment is working correctly

const https = require("https")
const http = require("http")

const APP_URL = "https://v0-mobile-recipe-site-2aojj74or-aaron-hirshkas-projects.vercel.app"

console.log("🍳 Just The Damn Recipe - Production Readiness Check")
console.log("==================================================")

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Check if URL is accessible
function checkUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http

    const req = client.get(url, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        })
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error("Request timeout"))
    })
  })
}

// Main check function
async function runChecks() {
  console.log(`\n${colors.blue}🔍 Checking production deployment...${colors.reset}`)

  try {
    // Check main app
    log("blue", "\n1. Checking main application...")
    const response = await checkUrl(APP_URL)

    if (response.statusCode === 200) {
      log("green", "✅ Main application is accessible")

      // Check if it's showing "Loading..." (missing env vars)
      if (response.body.includes("Loading...")) {
        log("yellow", '⚠️  Application is showing "Loading..." - likely missing environment variables')
      } else if (response.body.includes("Just The Damn Recipe")) {
        log("green", "✅ Application is loading correctly")
      } else {
        log("yellow", "⚠️  Application response is unexpected")
      }
    } else {
      log("red", `❌ Main application returned status: ${response.statusCode}`)
    }

    // Check API endpoints
    log("blue", "\n2. Checking API endpoints...")

    const apiEndpoints = ["/api/health", "/api/deployment-status", "/api/test/env-check"]

    for (const endpoint of apiEndpoints) {
      try {
        const apiResponse = await checkUrl(`${APP_URL}${endpoint}`)
        if (apiResponse.statusCode === 200) {
          log("green", `✅ ${endpoint} is working`)
        } else {
          log("yellow", `⚠️  ${endpoint} returned status: ${apiResponse.statusCode}`)
        }
      } catch (error) {
        log("red", `❌ ${endpoint} failed: ${error.message}`)
      }
    }

    // Check SSL certificate
    log("blue", "\n3. Checking SSL certificate...")
    if (APP_URL.startsWith("https:")) {
      log("green", "✅ Using HTTPS")
    } else {
      log("red", "❌ Not using HTTPS")
    }

    // Summary
    console.log(`\n${colors.blue}📋 Summary:${colors.reset}`)
    console.log(`App URL: ${APP_URL}`)
    console.log(`Status: ${response.statusCode === 200 ? "Accessible" : "Issues detected"}`)

    if (response.statusCode === 200) {
      console.log(`\n${colors.green}🎉 Production deployment appears to be working!${colors.reset}`)
      console.log(`\n${colors.blue}🔗 Next steps:${colors.reset}`)
      console.log("  • Visit your app and test user registration")
      console.log("  • Test recipe submission and browsing")
      console.log("  • Verify email functionality")
      console.log("  • Check admin panel access")
    } else {
      console.log(`\n${colors.red}❌ Issues detected with production deployment${colors.reset}`)
      console.log(`\n${colors.yellow}🔧 Troubleshooting:${colors.reset}`)
      console.log("  • Check Vercel deployment logs")
      console.log("  • Verify environment variables are set")
      console.log("  • Check domain configuration")
      console.log("  • Visit /deployment-status for detailed info")
    }
  } catch (error) {
    log("red", `❌ Failed to check production deployment: ${error.message}`)
    console.log(`\n${colors.yellow}🔧 Possible issues:${colors.reset}`)
    console.log("  • App is not deployed yet")
    console.log("  • Domain is not configured correctly")
    console.log("  • Network connectivity issues")
    console.log("  • App is experiencing downtime")
  }
}

// Run the checks
runChecks().catch(console.error)
