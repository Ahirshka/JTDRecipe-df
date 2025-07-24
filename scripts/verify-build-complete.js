#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔍 Comprehensive Build Verification")
console.log("=".repeat(50))

let hasErrors = false
let hasWarnings = false

function checkStep(name, condition, errorMsg = "", warningMsg = "") {
  if (condition === true) {
    console.log(`✅ ${name}`)
    return true
  } else if (condition === "warning") {
    console.log(`⚠️  ${name} - ${warningMsg}`)
    hasWarnings = true
    return false
  } else {
    console.log(`❌ ${name} - ${errorMsg}`)
    hasErrors = true
    return false
  }
}

try {
  console.log("\n📦 Package Management")
  console.log("-".repeat(30))

  // Check package.json
  const packageJsonExists = fs.existsSync("package.json")
  checkStep("package.json exists", packageJsonExists, "package.json not found")

  if (packageJsonExists) {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
    checkStep("packageManager specified", !!packageJson.packageManager, "Missing packageManager field")
    checkStep("Valid package name", packageJson.name === "jtdrecipe", "Package name mismatch")
  }

  // Check lockfile
  const lockfileExists = fs.existsSync("pnpm-lock.yaml")
  checkStep("pnpm-lock.yaml exists", lockfileExists, "Lockfile missing")

  if (lockfileExists) {
    const lockfileAge = (Date.now() - fs.statSync("pnpm-lock.yaml").mtime.getTime()) / 1000 / 60
    checkStep(
      "Lockfile is recent",
      lockfileAge < 30 ? true : "warning",
      "Lockfile is very old",
      `Generated ${Math.round(lockfileAge)} minutes ago`,
    )
  }

  console.log("\n🔧 Dependencies")
  console.log("-".repeat(30))

  // Test frozen lockfile compatibility
  try {
    execSync("pnpm install --frozen-lockfile --dry-run", { stdio: "pipe" })
    checkStep("Frozen lockfile compatible", true)
  } catch (error) {
    checkStep("Frozen lockfile compatible", false, "Lockfile incompatible with package.json")
  }

  // Check for problematic packages
  if (packageJsonExists) {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))
    const hasRadixSheet = packageJson.dependencies && packageJson.dependencies["@radix-ui/react-sheet"]
    checkStep("No invalid Radix packages", !hasRadixSheet, "@radix-ui/react-sheet doesn't exist")
  }

  console.log("\n🏗️  Build Process")
  console.log("-".repeat(30))

  // Check TypeScript compilation
  try {
    execSync("pnpm type-check", { stdio: "pipe" })
    checkStep("TypeScript compilation", true)
  } catch (error) {
    const output = error.stdout?.toString() || error.message
    if (output.includes("error TS")) {
      checkStep("TypeScript compilation", false, "TypeScript errors found")
    } else {
      checkStep("TypeScript compilation", "warning", "", "Minor TypeScript issues")
    }
  }

  // Run actual build
  console.log("\n🔨 Running production build...")
  const buildOutput = execSync("pnpm build", {
    stdio: "pipe",
    encoding: "utf8",
  })

  checkStep("Build completed", buildOutput.includes("✓ Compiled successfully"), "Build failed")
  checkStep("No build errors", !buildOutput.includes("Error:"), "Build contains errors")
  checkStep("Static optimization", buildOutput.includes("○"), "No static pages generated")

  console.log("\n📁 Build Artifacts")
  console.log("-".repeat(30))

  // Check build artifacts
  const nextDirExists = fs.existsSync(".next")
  checkStep(".next directory created", nextDirExists, "Build directory missing")

  if (nextDirExists) {
    const buildManifest = fs.existsSync(".next/build-manifest.json")
    checkStep("Build manifest exists", buildManifest, "Build manifest missing")

    const staticDir = fs.existsSync(".next/static")
    checkStep("Static assets generated", staticDir, "Static directory missing")

    const serverDir = fs.existsSync(".next/server")
    checkStep("Server files generated", serverDir, "Server directory missing")
  }

  console.log("\n🌐 Application Structure")
  console.log("-".repeat(30))

  // Check critical files
  const criticalFiles = [
    "app/layout.tsx",
    "app/page.tsx",
    "components/ui/sheet.tsx",
    "lib/neon.ts",
    "tailwind.config.ts",
    "next.config.mjs",
  ]

  criticalFiles.forEach((file) => {
    const exists = fs.existsSync(file)
    checkStep(`${file}`, exists, `Missing critical file: ${file}`)
  })

  // Check sheet component implementation
  if (fs.existsSync("components/ui/sheet.tsx")) {
    const sheetContent = fs.readFileSync("components/ui/sheet.tsx", "utf8")
    const usesDialog = sheetContent.includes("@radix-ui/react-dialog")
    checkStep("Sheet uses valid Radix component", usesDialog, "Sheet component may use invalid imports")
  }

  console.log("\n📊 Build Analysis")
  console.log("-".repeat(30))

  // Analyze build output
  const buildLines = buildOutput.split("\n")
  const routeLines = buildLines.filter((line) => line.includes("○") || line.includes("●") || line.includes("λ"))

  if (routeLines.length > 0) {
    console.log("📄 Generated Routes:")
    routeLines.forEach((line) => {
      if (line.trim()) {
        console.log(`   ${line.trim()}`)
      }
    })
  }

  console.log("\n" + "=".repeat(50))

  if (hasErrors) {
    console.log("❌ BUILD VERIFICATION FAILED")
    console.log("🔧 Please fix the errors above before deploying")
    process.exit(1)
  } else if (hasWarnings) {
    console.log("⚠️  BUILD VERIFICATION COMPLETED WITH WARNINGS")
    console.log("💡 Consider addressing warnings for optimal performance")
  } else {
    console.log("🎉 BUILD VERIFICATION SUCCESSFUL!")
    console.log("✅ All checks passed")
    console.log("🚀 Ready for production deployment!")
  }

  console.log("\n🎯 Next Steps:")
  console.log("1. Deploy to Vercel")
  console.log("2. Set up database")
  console.log("3. Test authentication flow")
  console.log("4. Add sample recipes")
} catch (error) {
  console.error("❌ Build verification failed with error:", error.message)
  console.log("\n🔍 Error Details:")
  console.log(error.stdout || error.message)
  process.exit(1)
}
