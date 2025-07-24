#!/usr/bin/env node

const { execSync } = require("child_process")

console.log("Installing dependencies with updated lockfile...")

try {
  // First, remove the existing lockfile if it exists
  console.log("Removing existing lockfile...")
  execSync("rm -f pnpm-lock.yaml", { stdio: "inherit" })

  // Install dependencies without frozen lockfile
  console.log("Running pnpm install --no-frozen-lockfile...")
  execSync("pnpm install --no-frozen-lockfile", { stdio: "inherit" })

  console.log("Dependencies installed successfully!")
  console.log("Lockfile has been updated to match package.json")
} catch (error) {
  console.error("Installation failed:", error.message)
  process.exit(1)
}
