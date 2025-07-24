import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL environment variable is not set",
      })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Drop existing tables to avoid conflicts
    await sql`DROP TABLE IF EXISTS email_tokens CASCADE`
    await sql`DROP TABLE IF EXISTS user_sessions CASCADE`
    await sql`DROP TABLE IF EXISTS recipes CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Create users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        email_verified BOOLEAN DEFAULT false,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `

    // Create recipes table
    await sql`
      CREATE TABLE recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        prep_time_minutes INTEGER,
        cook_time_minutes INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        category VARCHAR(100),
        image_url TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        author_username VARCHAR(255),
        moderation_status VARCHAR(50) DEFAULT 'approved',
        moderation_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user_sessions table
    await sql`
      CREATE TABLE user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `

    // Create email_tokens table
    await sql`
      CREATE TABLE email_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      )
    `

    // Create owner account
    const hashedPassword = await bcrypt.hash("Morton2121", 12)

    const ownerResult = await sql`
      INSERT INTO users (username, email, password_hash, role, status, email_verified)
      VALUES ('Site Owner', 'aaronhirshka@gmail.com', ${hashedPassword}, 'owner', 'active', true)
      RETURNING id, username, email, role
    `

    const ownerId = ownerResult[0].id

    // Create a sample recipe
    await sql`
      INSERT INTO recipes (
        title, 
        description, 
        ingredients, 
        instructions, 
        prep_time_minutes, 
        cook_time_minutes, 
        servings, 
        difficulty, 
        category, 
        author_id, 
        author_username,
        moderation_status
      ) VALUES (
        'Perfect Scrambled Eggs',
        'Creamy, fluffy scrambled eggs that are perfect every time.',
        '3 large eggs\n2 tablespoons butter\n2 tablespoons heavy cream\nSalt and pepper to taste\nChives for garnish',
        '1. Crack eggs into a bowl and whisk until well combined\n2. Heat butter in a non-stick pan over low heat\n3. Add eggs and stir constantly with a spatula\n4. When eggs start to set, add cream and continue stirring\n5. Remove from heat while still slightly wet\n6. Season with salt and pepper\n7. Garnish with chives and serve immediately',
        5,
        5,
        2,
        'easy',
        'breakfast',
        ${ownerId},
        'Site Owner',
        'approved'
      )
    `

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      owner: ownerResult[0],
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}
