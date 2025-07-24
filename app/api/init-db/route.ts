import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    console.log("Starting database initialization...")

    // Create users table
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

    // Create user_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipes table
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

    // Create comments table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'approved',
        is_flagged BOOLEAN DEFAULT false,
        flagged_reason TEXT,
        flagged_by INTEGER REFERENCES users(id),
        flagged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create ratings table
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(recipe_id, user_id)
      )
    `

    // Create email_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS email_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Check if owner account exists
    const existingOwner = await sql`
      SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com'
    `

    if (existingOwner.length === 0) {
      // Create owner account
      const passwordHash = await bcrypt.hash("Morton2121", 12)

      await sql`
        INSERT INTO users (
          username, email, password_hash, role, status, email_verified, created_at, updated_at
        ) VALUES (
          'Aaron Hirshka', 'aaronhirshka@gmail.com', ${passwordHash}, 'owner', 'active', true, NOW(), NOW()
        )
      `
      console.log("Owner account created successfully")
    } else {
      console.log("Owner account already exists")
    }

    // Get table counts
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
    const commentCount = await sql`SELECT COUNT(*) as count FROM comments`

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      data: {
        tables_created: ["users", "user_sessions", "recipes", "comments", "ratings", "email_tokens"],
        counts: {
          users: Number.parseInt(userCount[0].count),
          recipes: Number.parseInt(recipeCount[0].count),
          comments: Number.parseInt(commentCount[0].count),
        },
      },
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database initialization failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
