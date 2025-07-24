import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function initializeDatabase() {
  try {
    console.log("🗄️ Starting database initialization...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        verified BOOLEAN DEFAULT false,
        bio TEXT,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipes table
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB NOT NULL,
        instructions JSONB NOT NULL,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        category VARCHAR(100),
        tags JSONB,
        image_url VARCHAR(500),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        views INTEGER DEFAULT 0,
        average_rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
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
        content TEXT NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        flagged BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category)`
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_recipe_id ON comments(recipe_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_flagged ON comments(flagged)`

    console.log("✅ Database tables created successfully")

    // Check if owner account exists
    const existingOwner = await sql`
      SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com'
    `

    let ownerAccount = null

    if (existingOwner.length === 0) {
      // Create owner account
      const hashedPassword = await bcrypt.hash("Morton2121", 10)

      const newOwner = await sql`
        INSERT INTO users (username, email, password, role, verified, bio, avatar_url)
        VALUES ('Aaron Hirshka', 'aaronhirshka@gmail.com', ${hashedPassword}, 'owner', true, 'Site owner and administrator', '/placeholder-user.jpg')
        RETURNING id, username, email, role
      `

      ownerAccount = newOwner[0]
      console.log("✅ Owner account created")
    } else {
      ownerAccount = existingOwner[0]
      console.log("✅ Owner account already exists")
    }

    // Check if sample recipe exists
    const existingRecipes = await sql`
      SELECT id FROM recipes WHERE user_id = ${ownerAccount.id}
    `

    let sampleRecipe = null

    if (existingRecipes.length === 0) {
      // Create a sample recipe
      const newRecipe = await sql`
        INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings, difficulty, category, tags, image_url, user_id, status, views, average_rating)
        VALUES (
          'Perfect Scrambled Eggs',
          'The ultimate guide to making creamy, restaurant-quality scrambled eggs at home.',
          '["3 large eggs", "1 tablespoon butter", "2 tablespoons crème fraîche", "Salt and pepper to taste", "Fresh chives for garnish"]',
          '["Crack eggs into a cold pan with butter", "Turn heat to medium-low and stir constantly", "Remove from heat when almost set", "Add crème fraîche and season", "Garnish with chives and serve immediately"]',
          5, 5, 2, 'easy', 'breakfast',
          '["eggs", "breakfast", "quick", "easy"]',
          '/placeholder.jpg',
          ${ownerAccount.id},
          'approved',
          150,
          4.8
        )
        RETURNING id, title
      `

      sampleRecipe = newRecipe[0]
      console.log("✅ Sample recipe created")
    } else {
      sampleRecipe = existingRecipes[0]
      console.log("✅ Sample recipes already exist")
    }

    return {
      success: true,
      message: "Database initialized successfully",
      data: {
        owner: ownerAccount,
        sampleRecipe: sampleRecipe,
        tablesCreated: ["users", "recipes", "comments"],
        indexesCreated: 6,
      },
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}

export async function checkDatabaseStatus() {
  try {
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'recipes', 'comments')
    `

    const tableNames = tables.map((t) => t.table_name)
    const hasAllTables = ["users", "recipes", "comments"].every((table) => tableNames.includes(table))

    if (!hasAllTables) {
      return {
        initialized: false,
        message: "Database tables not found",
        missingTables: ["users", "recipes", "comments"].filter((table) => !tableNames.includes(table)),
      }
    }

    // Check if owner account exists
    const owner = await sql`
      SELECT id, username, email, role 
      FROM users 
      WHERE email = 'aaronhirshka@gmail.com'
    `

    if (owner.length === 0) {
      return {
        initialized: false,
        message: "Owner account not found",
        hasAllTables: true,
      }
    }

    // Get basic stats
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
    const commentCount = await sql`SELECT COUNT(*) as count FROM comments`

    return {
      initialized: true,
      message: "Database is properly initialized",
      data: {
        owner: owner[0],
        stats: {
          users: Number.parseInt(userCount[0].count),
          recipes: Number.parseInt(recipeCount[0].count),
          comments: Number.parseInt(commentCount[0].count),
        },
      },
    }
  } catch (error) {
    return {
      initialized: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
