import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        message: "DATABASE_URL not configured",
        error: "Missing DATABASE_URL environment variable",
        database_url_configured: false,
      })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Drop existing tables if they exist to avoid conflicts
    await sql`DROP TABLE IF EXISTS email_tokens CASCADE`
    await sql`DROP TABLE IF EXISTS user_sessions CASCADE`
    await sql`DROP TABLE IF EXISTS recipes CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Create users table with SERIAL (integer) primary key
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar TEXT,
        is_verified BOOLEAN DEFAULT false,
        bio TEXT,
        location VARCHAR(255),
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create user_sessions table with INTEGER user_id
    await sql`
      CREATE TABLE user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create email_tokens table with INTEGER user_id
    await sql`
      CREATE TABLE email_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipes table with INTEGER author_id
    await sql`
      CREATE TABLE recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        author_username VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        prep_time_minutes INTEGER NOT NULL,
        cook_time_minutes INTEGER NOT NULL,
        servings INTEGER NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
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

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_author ON recipes(author_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_published ON recipes(is_published)`
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_tokens(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_email_tokens_token ON email_tokens(token)`

    // Check if owner account exists
    const existingOwner = await sql`
      SELECT * FROM users WHERE email = 'aaronhirshka@gmail.com' LIMIT 1
    `

    let ownerAccount = null

    if (existingOwner.length === 0) {
      // Create owner account
      const passwordHash = await bcrypt.hash("Morton2121", 12)

      const newOwner = await sql`
        INSERT INTO users (username, email, password_hash, role, is_verified, created_at)
        VALUES ('Aaron Hirshka', 'aaronhirshka@gmail.com', ${passwordHash}, 'owner', true, NOW())
        RETURNING *
      `

      // Create a sample recipe
      await sql`
        INSERT INTO recipes (
          title, description, author_id, author_username, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, ingredients, instructions,
          moderation_status, is_published, created_at
        ) VALUES (
          'Perfect Scrambled Eggs',
          'Creamy, fluffy scrambled eggs made the right way',
          ${newOwner[0].id},
          'Aaron Hirshka',
          'Breakfast',
          'Easy',
          2,
          5,
          2,
          '3 large eggs
2 tbsp butter
2 tbsp heavy cream
Salt and pepper to taste',
          '1. Crack eggs into bowl
2. Add cream and whisk thoroughly
3. Heat butter in non-stick pan over low heat
4. Add eggs and stir constantly with rubber spatula
5. Remove from heat when still slightly wet
6. Season with salt and pepper',
          'approved',
          true,
          NOW()
        )
      `

      ownerAccount = {
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
        created: true,
      }
    } else {
      ownerAccount = {
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
        created: false,
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully with all tables and sample data",
      owner: ownerAccount,
      database_url_configured: true,
      tables_created: ["users", "user_sessions", "email_tokens", "recipes"],
    })
  } catch (error) {
    console.error("Database initialization failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Database initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
        database_url_configured: !!process.env.DATABASE_URL,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Database initialization endpoint",
    instructions: "Send a POST request to initialize the database and create the owner account",
    owner_credentials: {
      email: "aaronhirshka@gmail.com",
      password: "Morton2121",
      role: "owner",
    },
    database_url_configured: !!process.env.DATABASE_URL,
  })
}
