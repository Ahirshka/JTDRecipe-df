#!/usr/bin/env node

const https = require("https")
const http = require("http")

console.log("🔍 Verifying Deployment")
console.log("=".repeat(50))

const DOMAIN = "www.justhtedamnrecipe.net"
const FALLBACK_DOMAINS = ["justhtedamnrecipe.net"]

// Function to make HTTP request
function makeRequest(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http
    const req = protocol.get(url, { timeout }, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url,
        })
      })
    })

    req.on("timeout", () => {
      req.destroy()
      reject(new Error(`Request timeout for ${url}`))
    })

    req.on("error", (err) => {
      reject(err)
    })
  })
}

async function verifyDeployment() {
  console.log(`🌐 Testing primary domain: ${DOMAIN}`)

  try {
    // Test HTTPS
    console.log("\n📡 Testing HTTPS connection...")
    const httpsResponse = await makeRequest(`https://${DOMAIN}`)

    if (httpsResponse.statusCode === 200) {
      console.log("✅ HTTPS connection successful")
      console.log(`✅ Status: ${httpsResponse.statusCode}`)

      // Check for logo in HTML
      if (httpsResponse.body.includes("jtd-logo.png")) {
        console.log("✅ New logo found in HTML")
      } else if (httpsResponse.body.includes("Just The Damn Recipe") || httpsResponse.body.includes("JTDRecipe")) {
        console.log("✅ Site title found")
      } else {
        console.log("⚠️  Logo/title not detected in HTML")
      }

      // Check for React/Next.js
      if (httpsResponse.body.includes("__NEXT_DATA__") || httpsResponse.body.includes("_next")) {
        console.log("✅ Next.js application detected")
      }

      // Check content type
      if (httpsResponse.headers["content-type"]?.includes("text/html")) {
        console.log("✅ Correct content type")
      }
    } else {
      console.log(`⚠️  HTTPS returned status: ${httpsResponse.statusCode}`)
    }
  } catch (error) {
    console.log("❌ HTTPS connection failed:", error.message)

    // Try HTTP as fallback
    try {
      console.log("\n📡 Trying HTTP fallback...")
      const httpResponse = await makeRequest(`http://${DOMAIN}`)
      console.log(`⚠️  HTTP works but HTTPS failed. Status: ${httpResponse.statusCode}`)
    } catch (httpError) {
      console.log("❌ HTTP also failed:", httpError.message)
    }
  }

  // Test fallback domains
  for (const fallbackDomain of FALLBACK_DOMAINS) {
    try {
      console.log(`\n🔄 Testing fallback domain: ${fallbackDomain}`)
      const response = await makeRequest(`https://${fallbackDomain}`)
      console.log(`✅ ${fallbackDomain} - Status: ${response.statusCode}`)

      if (response.statusCode === 301 || response.statusCode === 302) {
        console.log(`✅ Redirect configured: ${response.headers.location}`)
      }
    } catch (error) {
      console.log(`⚠️  ${fallbackDomain} failed:`, error.message)
    }
  }

  // Test specific endpoints
  console.log("\n🧪 Testing specific endpoints...")

  const endpoints = ["/", "/login", "/search", "/api/auth/me"]

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`https://${DOMAIN}${endpoint}`)
      if (response.statusCode < 400) {
        console.log(`✅ ${endpoint} - Status: ${response.statusCode}`)
      } else {
        console.log(`⚠️  ${endpoint} - Status: ${response.statusCode}`)
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Failed: ${error.message}`)
    }
  }

  // DNS Check
  console.log("\n🔍 DNS Information:")
  try {
    const dns = require("dns").promises
    const addresses = await dns.resolve4(DOMAIN)
    console.log(`✅ DNS resolves to: ${addresses.join(", ")}`)
  } catch (error) {
    console.log("⚠️  DNS resolution failed:", error.message)
  }

  console.log("\n" + "=".repeat(50))
  console.log("🎯 Deployment Verification Summary:")
  console.log(`🌍 Primary URL: https://${DOMAIN}`)
  console.log("📋 Check the results above for any issues")
  console.log("\n💡 If issues found:")
  console.log("1. Check Vercel dashboard for deployment status")
  console.log("2. Verify DNS settings with domain provider")
  console.log("3. Check domain configuration in Vercel")
  console.log("4. Wait a few minutes for DNS propagation")
}

verifyDeployment().catch(console.error)
