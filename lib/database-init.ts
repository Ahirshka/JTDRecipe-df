import { sql } from "./neon"
import { createUser } from "./auth-system"

// Initialize database tables
export async function initializeDatabase(): Promise<{ success: boolean; message: string }> {
  console.log("🔄 [DB-INIT] Initializing database...")

  try {
    // Create users table
    console.log("📋 [DB-INIT] Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        is_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // Create sessions table
    console.log("📋 [DB-INIT] Creating sessions table...")
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // Create recipes table
    console.log("📋 [DB-INIT] Creating recipes table...")
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_username VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        prep_time_minutes INTEGER NOT NULL,
        cook_time_minutes INTEGER NOT NULL,
        servings INTEGER NOT NULL,
        image_url TEXT,
        ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
        instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        moderation_notes TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    console.log("✅ [DB-INIT] Database tables created successfully")

    return {
      success: true,
      message: "Database initialized successfully",
    }
  } catch (error) {
    console.error("❌ [DB-INIT] Database initialization error:", error)
    return {
      success: false,
      message: `Database initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Reset database (drop and recreate all tables)
export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  console.log("🔄 [DB-RESET] Resetting database...")

  try {
    // Drop tables in correct order (due to foreign key constraints)
    console.log("🗑️ [DB-RESET] Dropping tables...")
    await sql`DROP TABLE IF EXISTS sessions CASCADE`
    await sql`DROP TABLE IF EXISTS recipes CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    console.log("✅ [DB-RESET] Tables dropped successfully")

    // Reinitialize
    const initResult = await initializeDatabase()
    if (!initResult.success) {
      return initResult
    }

    console.log("✅ [DB-RESET] Database reset completed")

    return {
      success: true,
      message: "Database reset successfully",
    }
  } catch (error) {
    console.error("❌ [DB-RESET] Database reset error:", error)
    return {
      success: false,
      message: `Database reset failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Create default admin user
export async function createDefaultAdmin(
  username = "aaronhirshka",
  email = "aaronhirshka@gmail.com",
  password = "Morton2121",
): Promise<{ success: boolean; message: string; credentials?: any }> {
  console.log("👤 [DB-INIT] Creating default admin user...")

  try {
    // Delete existing admin if exists
    await sql`DELETE FROM users WHERE email = ${email} OR username = ${username}`

    // Create admin user
    const result = await createUser({
      username,
      email,
      password,
      role: "admin",
    })

    if (!result.success) {
      return {
        success: false,
        message: `Failed to create admin user: ${result.error}`,
      }
    }

    console.log("✅ [DB-INIT] Default admin user created")

    return {
      success: true,
      message: "Default admin user created successfully",
      credentials: {
        email,
        password,
        username,
      },
    }
  } catch (error) {
    console.error("❌ [DB-INIT] Error creating default admin:", error)
    return {
      success: false,
      message: `Failed to create admin user: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Get database status
export async function getDatabaseStatus(): Promise<{
  connected: boolean
  tables: { name: string; exists: boolean; count?: number }[]
  users: any[]
}> {
  console.log("🔍 [DB-STATUS] Checking database status...")

  try {
    // Check if tables exist
    const tableChecks = await Promise.all([
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`,
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sessions')`,
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipes')`,
    ])

    const tables = [
      { name: "users", exists: tableChecks[0][0].exists },
      { name: "sessions", exists: tableChecks[1][0].exists },
      { name: "recipes", exists: tableChecks[2][0].exists },
    ]

    // Get table counts if they exist
    for (const table of tables) {
      if (table.exists) {
        try {
          const countResult = await sql`SELECT COUNT(*) as count FROM ${sql(table.name)}`
          table.count = Number.parseInt(countResult[0].count)
        } catch (error) {
          console.error(`Error getting count for ${table.name}:`, error)
        }
      }
    }

    // Get users list
    let users: any[] = []
    if (tables.find((t) => t.name === "users")?.exists) {
      try {
        const usersResult = await sql`
          SELECT id, username, email, role, status, is_verified, created_at 
          FROM users 
          ORDER BY created_at DESC
        `
        users = usersResult
      } catch (error) {
        console.error("Error getting users:", error)
      }
    }

    console.log("✅ [DB-STATUS] Database status retrieved")

    return {
      connected: true,
      tables,
      users,
    }
  } catch (error) {
    console.error("❌ [DB-STATUS] Error checking database status:", error)
    return {
      connected: false,
      tables: [],
      users: [],
    }
  }
}
