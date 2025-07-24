import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    console.log("Starting database initialization...")

    // Drop existing tables to avoid conflicts
    await sql`DROP TABLE IF EXISTS recipe_tags CASCADE`
    await sql`DROP TABLE IF EXISTS recipe_instructions CASCADE`
    await sql`DROP TABLE IF EXISTS recipe_ingredients CASCADE`
    await sql`DROP TABLE IF EXISTS ratings CASCADE`
    await sql`DROP TABLE IF EXISTS comments CASCADE`
    await sql`DROP TABLE IF EXISTS recipes CASCADE`
    await sql`DROP TABLE IF EXISTS email_tokens CASCADE`
    await sql`DROP TABLE IF EXISTS user_sessions CASCADE`
    await sql`DROP TABLE IF EXISTS users CASCADE`

    // Create users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        avatar_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_flagged BOOLEAN DEFAULT false,
        flag_reason TEXT,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create user_sessions table
    await sql`
      CREATE TABLE user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
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
        used BOOLEAN DEFAULT false,
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
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        prep_time_minutes INTEGER DEFAULT 0,
        cook_time_minutes INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 1,
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        moderation_status VARCHAR(20) DEFAULT 'pending',
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipe_ingredients table
    await sql`
      CREATE TABLE recipe_ingredients (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient VARCHAR(255) NOT NULL,
        amount VARCHAR(50),
        unit VARCHAR(50)
      )
    `

    // Create recipe_instructions table
    await sql`
      CREATE TABLE recipe_instructions (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        instruction TEXT NOT NULL,
        step_number INTEGER NOT NULL
      )
    `

    // Create recipe_tags table
    await sql`
      CREATE TABLE recipe_tags (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL
      )
    `

    // Create comments table
    await sql`
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        moderation_status VARCHAR(20) DEFAULT 'approved',
        is_flagged BOOLEAN DEFAULT false,
        flag_reason TEXT,
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

    console.log("Tables created successfully")

    // Create owner account
    const hashedPassword = await bcrypt.hash("Morton2121", 10)

    const [ownerUser] = await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified, email_verified)
      VALUES ('Aaron Hirshka', 'aaronhirshka@gmail.com', ${hashedPassword}, 'owner', 'active', true, true)
      RETURNING id
    `

    console.log("Owner account created with ID:", ownerUser.id)

    // Create sample recipe
    const [sampleRecipe] = await sql`
      INSERT INTO recipes (
        title, description, author_id, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings,
        moderation_status, is_published, rating, review_count
      ) VALUES (
        'Perfect Scrambled Eggs',
        'Creamy, fluffy scrambled eggs that are perfect every time. The secret is low heat and constant stirring.',
        ${ownerUser.id},
        'Breakfast',
        'Easy',
        5,
        10,
        2,
        'approved',
        true,
        4.8,
        24
      )
      RETURNING id
    `

    // Add ingredients for sample recipe
    await sql`
      INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit) VALUES
      (${sampleRecipe.id}, 'Large eggs', '4', 'pieces'),
      (${sampleRecipe.id}, 'Butter', '2', 'tablespoons'),
      (${sampleRecipe.id}, 'Heavy cream', '2', 'tablespoons'),
      (${sampleRecipe.id}, 'Salt', '1/4', 'teaspoon'),
      (${sampleRecipe.id}, 'Black pepper', '1/8', 'teaspoon'),
      (${sampleRecipe.id}, 'Fresh chives', '1', 'tablespoon')
    `

    // Add instructions for sample recipe
    await sql`
      INSERT INTO recipe_instructions (recipe_id, instruction, step_number) VALUES
      (${sampleRecipe.id}, 'Crack eggs into a bowl and whisk together with cream, salt, and pepper until well combined.', 1),
      (${sampleRecipe.id}, 'Heat butter in a non-stick pan over low heat until melted and foaming.', 2),
      (${sampleRecipe.id}, 'Pour in the egg mixture and let it sit for 20 seconds without stirring.', 3),
      (${sampleRecipe.id}, 'Using a rubber spatula, gently stir the eggs, pushing them from the edges toward the center.', 4),
      (${sampleRecipe.id}, 'Continue cooking and stirring gently every 20 seconds until eggs are just set but still creamy.', 5),
      (${sampleRecipe.id}, 'Remove from heat and garnish with fresh chives. Serve immediately.', 6)
    `

    // Add tags for sample recipe
    await sql`
      INSERT INTO recipe_tags (recipe_id, tag) VALUES
      (${sampleRecipe.id}, 'quick'),
      (${sampleRecipe.id}, 'easy'),
      (${sampleRecipe.id}, 'breakfast'),
      (${sampleRecipe.id}, 'protein')
    `

    console.log("Sample recipe created successfully")

    return NextResponse.json({
      success: true,
      message:
        "Database initialized successfully! Owner account created with email: aaronhirshka@gmail.com and password: Morton2121",
      details: {
        ownerUserId: ownerUser.id,
        sampleRecipeId: sampleRecipe.id,
        tablesCreated: [
          "users",
          "user_sessions",
          "email_tokens",
          "recipes",
          "recipe_ingredients",
          "recipe_instructions",
          "recipe_tags",
          "comments",
          "ratings",
        ],
      },
    })
  } catch (error) {
    console.error("Database initialization failed:", error)
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
