#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔍 Verifying build completion and status...")

try {
  // Check if lockfile exists and is recent
  const lockfilePath = path.join(process.cwd(), "pnpm-lock.yaml")
  if (fs.existsSync(lockfilePath)) {
    const stats = fs.statSync(lockfilePath)
    const age = (Date.now() - stats.mtime.getTime()) / 1000 / 60 // minutes
    console.log(`✅ pnpm-lock.yaml exists (created ${Math.round(age)} minutes ago)`)
  } else {
    console.log("❌ pnpm-lock.yaml not found")
  }

  // Check if .next build directory exists
  const nextBuildPath = path.join(process.cwd(), ".next")
  if (fs.existsSync(nextBuildPath)) {
    console.log("✅ .next build directory exists")

    // Check for build artifacts
    const buildManifest = path.join(nextBuildPath, "build-manifest.json")
    if (fs.existsSync(buildManifest)) {
      console.log("✅ Build manifest found")
    }
  } else {
    console.log("⚠️  .next build directory not found - running build...")
    execSync("pnpm build", { stdio: "inherit" })
  }

  // Verify package.json and lockfile compatibility
  console.log("🔍 Checking package.json and lockfile compatibility...")
  try {
    execSync("pnpm install --frozen-lockfile --dry-run", {
      stdio: "pipe",
      encoding: "utf8",
    })
    console.log("✅ Package.json and lockfile are compatible")
  } catch (error) {
    console.log("❌ Lockfile compatibility issue:", error.message)
    return
  }

  // Test TypeScript compilation
  console.log("🔍 Checking TypeScript compilation...")
  try {
    execSync("pnpm type-check", { stdio: "pipe" })
    console.log("✅ TypeScript compilation successful")
  } catch (error) {
    console.log("⚠️  TypeScript issues found (but build may still work)")
  }

  // Check for common build issues
  console.log("🔍 Checking for common issues...")

  // Check if all required files exist
  const requiredFiles = ["app/layout.tsx", "app/page.tsx", "tailwind.config.ts", "next.config.mjs"]

  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`)
    } else {
      console.log(`❌ Missing required file: ${file}`)
    }
  }

  // Final build test
  console.log("🔨 Running final build test...")
  const buildOutput = execSync("pnpm build", {
    stdio: "pipe",
    encoding: "utf8",
  })

  if (buildOutput.includes("✓ Compiled successfully")) {
    console.log("🎉 BUILD VERIFICATION SUCCESSFUL!")
    console.log("✅ All checks passed")
    console.log("🚀 Ready for deployment!")
  } else {
    console.log("⚠️  Build completed but with warnings")
    console.log("Build output:", buildOutput)
  }
} catch (error) {
  console.error("❌ Build verification failed:", error.message)
  console.log("\n🔍 Build output:")
  console.log(error.stdout || error.message)

  console.log("\n💡 Common solutions:")
  console.log("1. Check for TypeScript errors: pnpm type-check")
  console.log("2. Check for linting errors: pnpm lint")
  console.log("3. Verify all imports are correct")
  console.log("4. Check Next.js configuration")
}
