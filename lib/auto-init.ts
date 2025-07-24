import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function autoInitializeDatabase() {
  try {
    console.log("Starting auto-initialization...")

    // Create all tables
    await createTables()

    // Create owner account
    await createOwnerAccount()

    // Seed with sample data
    await seedSampleData()

    console.log("Auto-initialization completed successfully")
    return { success: true }
  } catch (error) {
    console.error("Auto-initialization failed:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

async function createTables() {
  // Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      status VARCHAR(50) DEFAULT 'active',
      email_verified BOOLEAN DEFAULT false,
      avatar TEXT,
      bio TEXT,
      location VARCHAR(255),
      website VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      last_login_at TIMESTAMP
    )
  `

  // Recipes table
  await sql`
    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      author_username VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      difficulty VARCHAR(50) NOT NULL,
      prep_time_minutes INTEGER NOT NULL DEFAULT 0,
      cook_time_minutes INTEGER NOT NULL DEFAULT 0,
      servings INTEGER NOT NULL DEFAULT 1,
      ingredients TEXT NOT NULL,
      instructions TEXT NOT NULL,
      image_url TEXT,
      rating DECIMAL(3,2) DEFAULT 0.0,
      rating_count INTEGER DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      moderation_status VARCHAR(50) DEFAULT 'pending',
      is_published BOOLEAN DEFAULT false,
      moderated_by INTEGER REFERENCES users(id),
      moderated_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  // Comments table
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      flagged BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  // Create indexes for better performance
  await sql`CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_recipes_moderation_status ON recipes(moderation_status)`
  await sql`CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category)`
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_flagged ON comments(flagged)`
}

async function createOwnerAccount() {
  const existingOwner = await sql`
    SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com'
  `

  if (existingOwner.length === 0) {
    const passwordHash = await bcrypt.hash("Morton2121", 12)

    await sql`
      INSERT INTO users (
        username, email, password_hash, role, status, email_verified, created_at, updated_at
      ) VALUES (
        'Aaron Hirshka', 'aaronhirshka@gmail.com', ${passwordHash}, 'owner', 'active', true, NOW(), NOW()
      )
    `
  }
}

async function seedSampleData() {
  // Add sample users and recipes here if needed
  console.log("Sample data seeding completed")
}
