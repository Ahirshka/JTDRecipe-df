import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    console.log("Starting database initialization...")

    // Drop existing tables to start fresh
    await sql`DROP TABLE IF EXISTS user_flags CASCADE`
    await sql`DROP TABLE IF EXISTS comment_flags CASCADE`
    await sql`DROP TABLE IF EXISTS ratings CASCADE`
    await sql`DROP TABLE IF EXISTS comments CASCADE`
    await sql`DROP TABLE IF EXISTS recipes CASCADE`
    await sql`DROP TABLE IF EXISTS user_sessions CASCADE`
    await sql`DROP TABLE IF EXISTS email_tokens CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Create users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        avatar_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_profile_verified BOOLEAN DEFAULT false,
        bio TEXT,
        location VARCHAR(255),
        website VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `

    // Create user_sessions table
    await sql`
      CREATE TABLE user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipes table
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
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'approved',
        moderated_by INTEGER REFERENCES users(id),
        moderated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create ratings table
    await sql`
      CREATE TABLE ratings (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(recipe_id, user_id)
      )
    `

    // Create comment_flags table
    await sql`
      CREATE TABLE comment_flags (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        flagged_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create user_flags table
    await sql`
      CREATE TABLE user_flags (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        flagged_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create email_tokens table
    await sql`
      CREATE TABLE email_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log("Tables created successfully")

    // Create owner account
    const ownerEmail = "aaronhirshka@gmail.com"
    const ownerPassword = "Morton2121!"
    const passwordHash = await bcrypt.hash(ownerPassword, 12)

    const ownerResult = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        is_verified, 
        is_profile_verified,
        status,
        created_at
      ) VALUES (
        'Aaron Hirshka',
        ${ownerEmail},
        ${passwordHash},
        'owner',
        true,
        true,
        'active',
        NOW()
      ) RETURNING id, username, email, role
    `

    console.log("Owner account created:", ownerResult[0])

    // Create a sample approved recipe
    const sampleRecipeResult = await sql`
      INSERT INTO recipes (
        title,
        description,
        author_id,
        author_username,
        category,
        difficulty,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        ingredients,
        instructions,
        moderation_status,
        is_published,
        rating,
        rating_count,
        created_at
      ) VALUES (
        'Perfect Scrambled Eggs',
        'Creamy, fluffy scrambled eggs made the right way - no more rubbery eggs!',
        ${ownerResult[0].id},
        'Aaron Hirshka',
        'Breakfast',
        'Easy',
        2,
        5,
        2,
        '• 3 large eggs
• 2 tablespoons butter
• 2 tablespoons heavy cream
• Salt and pepper to taste
• Optional: chives for garnish',
        '1. Crack eggs into a bowl and whisk gently
2. Add cream and a pinch of salt, whisk until combined
3. Heat butter in a non-stick pan over medium-low heat
4. Pour in egg mixture and let sit for 20 seconds
5. Using a spatula, gently stir from the outside in
6. Continue stirring gently every 20 seconds
7. Remove from heat when eggs are still slightly wet
8. Season with salt and pepper, garnish with chives if desired',
        'approved',
        true,
        4.8,
        12,
        NOW()
      ) RETURNING id
    `

    console.log("Sample recipe created:", sampleRecipeResult[0])

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      data: {
        owner: ownerResult[0],
        sampleRecipe: sampleRecipeResult[0],
      },
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
