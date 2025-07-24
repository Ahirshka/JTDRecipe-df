#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔄 Regenerating package.json and lockfile...")

try {
  // Remove existing lockfile and node_modules
  const lockfilePath = path.join(process.cwd(), "pnpm-lock.yaml")
  const nodeModulesPath = path.join(process.cwd(), "node_modules")

  if (fs.existsSync(lockfilePath)) {
    fs.unlinkSync(lockfilePath)
    console.log("✅ Removed old lockfile")
  }

  if (fs.existsSync(nodeModulesPath)) {
    execSync("rm -rf node_modules", { stdio: "inherit" })
    console.log("✅ Cleaned node_modules")
  }

  // Clear pnpm store
  try {
    execSync("pnpm store prune", { stdio: "inherit" })
    console.log("✅ Cleared pnpm store")
  } catch (e) {
    console.log("⚠️  Could not clear pnpm store (continuing...)")
  }

  // Install with fresh lockfile
  console.log("📦 Installing dependencies with fresh lockfile...")
  execSync("pnpm install --no-frozen-lockfile --prefer-frozen-lockfile=false", {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  })

  // Verify installation
  if (fs.existsSync(lockfilePath)) {
    console.log("✅ Successfully generated new pnpm-lock.yaml")
  } else {
    throw new Error("Failed to generate lockfile")
  }

  // Test build
  console.log("🔨 Testing build...")
  execSync("pnpm build", { stdio: "inherit" })

  console.log("🎉 Package.json and lockfile successfully regenerated!")
  console.log("🚀 Ready for deployment!")
} catch (error) {
  console.error("❌ Error regenerating lockfile:", error.message)
  console.log("\n💡 Try running manually:")
  console.log("rm pnpm-lock.yaml")
  console.log("rm -rf node_modules")
  console.log("pnpm install")
  process.exit(1)
}
