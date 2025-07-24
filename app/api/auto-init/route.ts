import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    console.log("🚀 Auto-initializing database on deployment...")

    // Check if already initialized
    try {
      const ownerCheck = await sql`
        SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com' AND role = 'owner'
      `

      if (ownerCheck.length > 0) {
        console.log("✅ Database already initialized")
        return NextResponse.json({
          success: true,
          message: "Database already initialized",
          alreadyInitialized: true,
        })
      }
    } catch (error) {
      console.log("📋 Database tables don't exist yet, creating...")
    }

    // Create all tables
    console.log("🗄️ Creating database tables...")

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

    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

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

    console.log("✅ Database tables created")

    // Create owner account
    console.log("👤 Creating owner account...")
    const passwordHash = await bcrypt.hash("Morton2121", 12)

    const ownerResult = await sql`
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
      ) RETURNING id, username, email, role
    `

    console.log("✅ Owner account created:", ownerResult[0])

    // Create sample recipe
    console.log("🍳 Creating sample recipe...")
    const sampleRecipe = await sql`
      INSERT INTO recipes (
        title, description, author_id, author_username, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, ingredients, instructions,
        moderation_status, is_published, rating, rating_count, created_at, updated_at
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
        NOW(),
        NOW()
      ) RETURNING id, title
    `

    console.log("✅ Sample recipe created:", sampleRecipe[0])

    console.log("🎉 Database auto-initialization completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Database auto-initialized successfully on deployment",
      data: {
        owner: ownerResult[0],
        sampleRecipe: sampleRecipe[0],
      },
    })
  } catch (error) {
    console.error("❌ Auto-initialization failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to auto-initialize database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
