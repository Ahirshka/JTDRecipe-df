const fs = require("fs")
const { execSync } = require("child_process")

console.log("🔧 Fixing Next.js SWC dependencies...")

try {
  // Remove existing lockfile and node_modules
  if (fs.existsSync("package-lock.json")) {
    fs.unlinkSync("package-lock.json")
    console.log("✅ Removed old package-lock.json")
  }

  if (fs.existsSync("node_modules")) {
    execSync("rm -rf node_modules", { stdio: "inherit" })
    console.log("✅ Removed node_modules")
  }

  // Clear npm cache
  execSync("npm cache clean --force", { stdio: "inherit" })
  console.log("✅ Cleared npm cache")

  // Install dependencies with legacy peer deps
  execSync("npm install --legacy-peer-deps", { stdio: "inherit" })
  console.log("✅ Reinstalled dependencies")

  // Run Next.js build to generate SWC dependencies
  console.log("🏗️ Running Next.js build to generate SWC dependencies...")
  execSync("npx next build", { stdio: "inherit" })
  console.log("✅ Build completed successfully")

  console.log("🎉 Dependencies fixed successfully!")
} catch (error) {
  console.error("❌ Error fixing dependencies:", error.message)
  process.exit(1)
}
