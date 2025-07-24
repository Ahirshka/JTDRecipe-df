import { initializeDatabase } from "./neon"

export async function autoInitializeDatabase() {
  try {
    console.log("🔍 Checking if database needs initialization...")

    const success = await initializeDatabase()

    if (success) {
      console.log("✅ Database auto-initialization completed")
      return true
    } else {
      console.log("❌ Database auto-initialization failed")
      return false
    }
  } catch (error) {
    console.error("Auto-initialization error:", error)
    return false
  }
}
