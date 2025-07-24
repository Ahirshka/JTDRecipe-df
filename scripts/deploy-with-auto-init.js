const { execSync } = require("child_process")

async function deployWithAutoInit() {
  try {
    console.log("🚀 Starting deployment with auto-initialization...")

    // Build the application
    console.log("📦 Building application...")
    execSync("npm run build", { stdio: "inherit" })

    // Deploy to Vercel
    console.log("🌐 Deploying to Vercel...")
    execSync("vercel --prod", { stdio: "inherit" })

    // Wait a moment for deployment to be ready
    console.log("⏳ Waiting for deployment to be ready...")
    await new Promise((resolve) => setTimeout(resolve, 10000))

    // Try to initialize the database
    console.log("🗄️ Initializing database...")
    try {
      const response = await fetch("https://www.justhtedamnrecipe.net/api/auto-init", {
        method: "POST",
      })
      const result = await response.json()

      if (result.success) {
        console.log("✅ Database initialized successfully!")
      } else {
        console.log("⚠️ Database initialization may have failed, but deployment is complete")
      }
    } catch (error) {
      console.log("⚠️ Could not auto-initialize database, but deployment is complete")
      console.log("💡 You can manually initialize at: https://www.justhtedamnrecipe.net/database-setup")
    }

    console.log("🎉 Deployment completed!")
    console.log("🌐 Site: https://www.justhtedamnrecipe.net")
    console.log("👤 Owner Login: aaronhirshka@gmail.com / Morton2121")
    console.log("⚙️ Admin Panel: https://www.justhtedamnrecipe.net/admin")
    console.log("🗄️ Database Setup: https://www.justhtedamnrecipe.net/database-setup")
  } catch (error) {
    console.error("❌ Deployment failed:", error.message)
    process.exit(1)
  }
}

deployWithAutoInit()
