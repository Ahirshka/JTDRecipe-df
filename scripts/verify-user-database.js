// Script to verify user data is being stored correctly in the database
import { sql, initializeDatabase } from "../lib/neon.js"

async function verifyUserDatabase() {
  console.log("🔍 Verifying User Database...")

  try {
    // Initialize database
    await initializeDatabase()
    console.log("✅ Database initialized")

    // Check if users table exists and has correct structure
    console.log("\n📋 Checking users table structure...")
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `

    console.log("Users table columns:")
    tableInfo.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === "NO" ? "(NOT NULL)" : "(NULLABLE)"}`)
    })

    // Check existing users
    console.log("\n👥 Checking existing users...")
    const users = await sql`
      SELECT id, username, email, role, status, is_verified, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `

    if (users.length === 0) {
      console.log("No users found in database")
    } else {
      console.log(`Found ${users.length} users:`)
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}, Status: ${user.status}`)
      })
    }

    // Check user sessions table
    console.log("\n🔐 Checking user sessions...")
    const sessions = await sql`
      SELECT s.id, s.user_id, u.username, s.expires_at, s.created_at
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > NOW()
      ORDER BY s.created_at DESC
      LIMIT 5
    `

    if (sessions.length === 0) {
      console.log("No active sessions found")
    } else {
      console.log(`Found ${sessions.length} active sessions:`)
      sessions.forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.username} - Expires: ${session.expires_at}`)
      })
    }
  } catch (error) {
    console.error("🚨 Database verification error:", error)
  }
}

// Run verification
verifyUserDatabase()
