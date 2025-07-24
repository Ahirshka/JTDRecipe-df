import { sql } from "@/lib/neon"

export async function checkAndInitializeDatabase() {
  try {
    // Check if database is initialized
    const ownerExists = await sql`
      SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com' AND role = 'owner'
    `

    if (ownerExists.length === 0) {
      console.log("🚀 Database not initialized, triggering auto-initialization...")

      // Call the auto-init endpoint
      const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/auto-init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        console.log("✅ Database auto-initialized successfully")
        return true
      } else {
        console.error("❌ Database auto-initialization failed:", result.error)
        return false
      }
    }

    console.log("✅ Database already initialized")
    return true
  } catch (error) {
    console.error("❌ Database check failed:", error)
    return false
  }
}
