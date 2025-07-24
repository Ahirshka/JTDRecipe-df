#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const https = require("https")

console.log("🔍 Collecting and Compiling Errors for Troubleshooting")
console.log("=".repeat(60))

const errors = []
const warnings = []
const info = []

function addError(category, message, details = "") {
  errors.push({ category, message, details, timestamp: new Date().toISOString() })
}

function addWarning(category, message, details = "") {
  warnings.push({ category, message, details, timestamp: new Date().toISOString() })
}

function addInfo(category, message, details = "") {
  info.push({ category, message, details, timestamp: new Date().toISOString() })
}

function runCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`)
    const output = execSync(command, { encoding: "utf8", stdio: "pipe" })
    addInfo("Command", `${description} - SUCCESS`, output.slice(0, 500))
    return { success: true, output }
  } catch (error) {
    console.log(`❌ ${description} - FAILED`)
    addError("Command", `${description} - FAILED`, error.message + "\n" + (error.stdout || ""))
    return { success: false, error: error.message, output: error.stdout }
  }
}

async function collectErrors() {
  console.log("\n📦 Package Management Errors")
  console.log("-".repeat(40))

  // Check package.json
  try {
    if (!fs.existsSync("package.json")) {
      addError("Package", "package.json not found", "Missing package.json file")
    } else {
      const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
      addInfo("Package", "package.json found", `Name: ${packageJson.name}, Version: ${packageJson.version}`)

      if (!packageJson.packageManager) {
        addWarning("Package", "Missing packageManager field", "Could cause deployment issues")
      }
    }
  } catch (error) {
    addError("Package", "Invalid package.json", error.message)
  }

  // Check lockfile
  if (!fs.existsSync("pnpm-lock.yaml")) {
    addError("Package", "pnpm-lock.yaml not found", "Missing lockfile")
  } else {
    const lockfileAge = (Date.now() - fs.statSync("pnpm-lock.yaml").mtime.getTime()) / 1000 / 60
    if (lockfileAge > 60) {
      addWarning("Package", "Lockfile is old", `Generated ${Math.round(lockfileAge)} minutes ago`)
    }
  }

  // Test pnpm install
  runCommand("pnpm install --frozen-lockfile --dry-run", "Testing frozen lockfile compatibility")

  console.log("\n🏗️  Build Errors")
  console.log("-".repeat(40))

  // Test TypeScript
  const tsCheck = runCommand("pnpm type-check", "TypeScript compilation check")

  // Test build
  const buildResult = runCommand("pnpm build", "Production build test")

  // Check build artifacts
  if (!fs.existsSync(".next")) {
    addError("Build", ".next directory missing", "Build artifacts not generated")
  } else {
    const buildFiles = ["build-manifest.json", "static", "server"]
    buildFiles.forEach((file) => {
      if (!fs.existsSync(path.join(".next", file))) {
        addError("Build", `Missing build artifact: ${file}`, "Incomplete build")
      }
    })
  }

  console.log("\n🌐 Deployment & Network Errors")
  console.log("-".repeat(40))

  // Test domain connectivity
  const domains = ["www.justhtedamnrecipe.net", "justhtedamnrecipe.net"]

  for (const domain of domains) {
    try {
      console.log(`🔗 Testing ${domain}...`)
      const response = await new Promise((resolve, reject) => {
        const req = https.get(`https://${domain}`, { timeout: 10000 }, (res) => {
          let data = ""
          res.on("data", (chunk) => (data += chunk))
          res.on("end", () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }))
        })
        req.on("timeout", () => {
          req.destroy()
          reject(new Error("Request timeout"))
        })
        req.on("error", reject)
      })

      if (response.statusCode === 200) {
        addInfo("Network", `${domain} accessible`, `Status: ${response.statusCode}`)
      } else {
        addWarning("Network", `${domain} returned ${response.statusCode}`, "Non-200 status code")
      }
    } catch (error) {
      addError("Network", `${domain} connection failed`, error.message)
    }
  }

  console.log("\n📁 File System Errors")
  console.log("-".repeat(40))

  // Check critical files
  const criticalFiles = [
    "app/layout.tsx",
    "app/page.tsx",
    "components/navigation.tsx",
    "components/ui/sheet.tsx",
    "lib/neon.ts",
    "public/jtd-logo.png",
    "vercel.json",
    "tailwind.config.ts",
    "next.config.mjs",
  ]

  criticalFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
      addError("FileSystem", `Missing critical file: ${file}`, "Required file not found")
    } else {
      // Check file size
      const stats = fs.statSync(file)
      if (stats.size === 0) {
        addError("FileSystem", `Empty file: ${file}`, "File exists but is empty")
      }
    }
  })

  // Check for problematic imports
  if (fs.existsSync("components/ui/sheet.tsx")) {
    const sheetContent = fs.readFileSync("components/ui/sheet.tsx", "utf8")
    if (sheetContent.includes("@radix-ui/react-sheet")) {
      addError("Dependencies", "Invalid import in sheet.tsx", "@radix-ui/react-sheet doesn't exist")
    }
  }

  console.log("\n🔧 Configuration Errors")
  console.log("-".repeat(40))

  // Check Next.js config
  if (fs.existsSync("next.config.mjs")) {
    try {
      const nextConfig = fs.readFileSync("next.config.mjs", "utf8")
      addInfo("Config", "next.config.mjs found", "Configuration file present")
    } catch (error) {
      addError("Config", "next.config.mjs read error", error.message)
    }
  }

  // Check Tailwind config
  if (fs.existsSync("tailwind.config.ts")) {
    try {
      const tailwindConfig = fs.readFileSync("tailwind.config.ts", "utf8")
      addInfo("Config", "tailwind.config.ts found", "Tailwind configuration present")
    } catch (error) {
      addError("Config", "tailwind.config.ts read error", error.message)
    }
  }

  // Check environment variables
  const requiredEnvVars = ["DATABASE_URL", "POSTGRES_URL"]
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      addWarning("Environment", `Missing ${envVar}`, "Database connection may fail")
    }
  })

  console.log("\n📊 Error Summary")
  console.log("=".repeat(60))

  console.log(`\n❌ ERRORS (${errors.length}):`)
  if (errors.length === 0) {
    console.log("   No errors found! ✅")
  } else {
    errors.forEach((error, index) => {
      console.log(`\n${index + 1}. [${error.category}] ${error.message}`)
      if (error.details) {
        console.log(`   Details: ${error.details.slice(0, 200)}${error.details.length > 200 ? "..." : ""}`)
      }
    })
  }

  console.log(`\n⚠️  WARNINGS (${warnings.length}):`)
  if (warnings.length === 0) {
    console.log("   No warnings found! ✅")
  } else {
    warnings.forEach((warning, index) => {
      console.log(`\n${index + 1}. [${warning.category}] ${warning.message}`)
      if (warning.details) {
        console.log(`   Details: ${warning.details.slice(0, 200)}${warning.details.length > 200 ? "..." : ""}`)
      }
    })
  }

  console.log(`\n💡 INFO (${info.length}):`)
  info.slice(0, 5).forEach((item, index) => {
    console.log(`${index + 1}. [${item.category}] ${item.message}`)
  })

  // Generate troubleshooting report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      errors: errors.length,
      warnings: warnings.length,
      info: info.length,
    },
    errors,
    warnings,
    info,
  }

  fs.writeFileSync("error-report.json", JSON.stringify(report, null, 2))
  console.log("\n📄 Detailed report saved to: error-report.json")

  console.log("\n🎯 Next Steps:")
  if (errors.length > 0) {
    console.log("1. Fix the errors listed above")
    console.log("2. Re-run this script to verify fixes")
    console.log("3. Deploy after all errors are resolved")
  } else if (warnings.length > 0) {
    console.log("1. Address warnings for optimal performance")
    console.log("2. Deploy - warnings won't block deployment")
  } else {
    console.log("1. All checks passed! ✅")
    console.log("2. Ready for deployment 🚀")
  }

  return { errors, warnings, info }
}

collectErrors().catch((error) => {
  console.error("❌ Error collection failed:", error)
  addError("Script", "Error collection failed", error.message)
})
