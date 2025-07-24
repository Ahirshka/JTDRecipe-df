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

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
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

      ownerAccount = {
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
      }
    } else {
      ownerAccount = {
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
        role: "owner",
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      owner: ownerAccount,
      database_url_configured: true,
    })
  } catch (error) {
    console.error("Database initialization failed:", error)

    return NextResponse.json({
      success: false,
      message: "Database initialization failed",
      error: error instanceof Error ? error.message : "Unknown error",
      database_url_configured: !!process.env.DATABASE_URL,
    })
  }
}
