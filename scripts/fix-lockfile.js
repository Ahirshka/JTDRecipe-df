#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔧 Fixing pnpm lockfile compatibility...")

try {
  // Remove any existing lockfile
  const lockfilePath = path.join(process.cwd(), "pnpm-lock.yaml")
  if (fs.existsSync(lockfilePath)) {
    fs.unlinkSync(lockfilePath)
    console.log("✅ Removed old lockfile")
  }

  // Remove node_modules to ensure clean install
  const nodeModulesPath = path.join(process.cwd(), "node_modules")
  if (fs.existsSync(nodeModulesPath)) {
    execSync("rm -rf node_modules", { stdio: "inherit" })
    console.log("✅ Cleaned node_modules")
  }

  // Clear pnpm cache
  try {
    execSync("pnpm store prune", { stdio: "inherit" })
    console.log("✅ Cleared pnpm cache")
  } catch (e) {
    console.log("⚠️  Could not clear pnpm cache (this is okay)")
  }

  // Install dependencies with latest pnpm
  console.log("📦 Installing dependencies...")
  execSync("pnpm install --no-frozen-lockfile", { stdio: "inherit" })

  console.log("✅ Successfully regenerated pnpm-lock.yaml")
  console.log("🚀 Ready for deployment!")
} catch (error) {
  console.error("❌ Error fixing lockfile:", error.message)
  process.exit(1)
}
