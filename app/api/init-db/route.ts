import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

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
        prep_time_minutes INTEGER DEFAULT 0,
        cook_time_minutes INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 1,
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
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        is_flagged BOOLEAN DEFAULT false,
        flagged_by INTEGER REFERENCES users(id),
        flagged_at TIMESTAMP,
        flag_reason TEXT,
        moderation_reason TEXT,
        moderated_by INTEGER REFERENCES users(id),
        moderated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
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
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(recipe_id, user_id)
      )
    `

    // Create recipe_ingredients table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient VARCHAR(255) NOT NULL,
        amount VARCHAR(100),
        unit VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipe_instructions table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_instructions (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        instruction TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipe_tags table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_tags (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL,
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
          username, email, password_hash, role, is_verified, is_profile_verified, status, created_at, updated_at
        ) VALUES (
          'Aaron Hirshka', 
          'aaronhirshka@gmail.com', 
          ${passwordHash}, 
          'owner', 
          true, 
          true, 
          'active', 
          NOW(), 
          NOW()
        )
      `

      console.log("Owner account created successfully")
    } else {
      console.log("Owner account already exists")
    }

    // Create sample recipe if none exist
    const existingRecipes = await sql`
      SELECT id FROM recipes LIMIT 1
    `

    if (existingRecipes.length === 0) {
      const owner = await sql`
        SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com'
      `

      if (owner.length > 0) {
        await sql`
          INSERT INTO recipes (
            title, description, author_id, author_username, category, difficulty,
            prep_time_minutes, cook_time_minutes, servings, ingredients, instructions,
            moderation_status, is_published, created_at, updated_at
          ) VALUES (
            'Perfect Scrambled Eggs',
            'Creamy, fluffy scrambled eggs made the right way',
            ${owner[0].id},
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
3. Heat butter in non-stick pan over medium-low heat
4. Add eggs and stir constantly with rubber spatula
5. Remove from heat when still slightly wet
6. Season with salt and pepper',
            'approved',
            true,
            NOW(),
            NOW()
          )
        `
        console.log("Sample recipe created")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully with owner account and sample data",
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

export async function GET() {
  try {
    // Check if database is initialized by looking for the owner account
    const ownerExists = await sql`
      SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com' AND role = 'owner'
    `

    return NextResponse.json({
      initialized: ownerExists.length > 0,
      message: ownerExists.length > 0 ? "Database is initialized" : "Database needs initialization",
    })
  } catch (error) {
    return NextResponse.json({
      initialized: false,
      message: "Database connection failed or tables don't exist",
    })
  }
}
