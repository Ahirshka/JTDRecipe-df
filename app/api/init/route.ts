import { NextResponse } from "next/server"
import { initializeAuthSystem } from "@/lib/auth-system"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function GET() {
  console.log("🔍 [INIT-API] System status check requested")

  try {
    return NextResponse.json({
      success: true,
      message: "System is running",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ [INIT-API] Error checking system status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System status check failed",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  console.log("🚀 [INIT] System initialization started")

  try {
    // Initialize authentication system
    const authSuccess = await initializeAuthSystem()

    if (!authSuccess) {
      console.log("❌ [INIT] Authentication system initialization failed")
      return NextResponse.json(
        {
          success: false,
          error: "Authentication system initialization failed",
        },
        { status: 500 },
      )
    }

    // Create users table
    console.log("📋 [INIT] Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user sessions table
    console.log("📋 [INIT] Creating user_sessions table...")
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create recipes table
    console.log("📋 [INIT] Creating recipes table...")
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB,
        instructions JSONB,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        tags JSONB,
        image_url VARCHAR(500),
        author_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create pending recipes table
    console.log("📋 [INIT] Creating pending_recipes table...")
    await sql`
      CREATE TABLE IF NOT EXISTS pending_recipes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB,
        instructions JSONB,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        difficulty VARCHAR(50),
        tags JSONB,
        image_url VARCHAR(500),
        author_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create rejected recipes table
    console.log("📋 [INIT] Creating rejected_recipes table...")
    await sql`
      CREATE TABLE IF NOT EXISTS rejected_recipes (
        id SERIAL PRIMARY KEY,
        original_recipe_id INTEGER,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB,
        instructions JSONB,
        author_id INTEGER REFERENCES users(id),
        rejection_reason TEXT,
        rejected_by INTEGER REFERENCES users(id),
        rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create comments table
    console.log("📋 [INIT] Creating comments table...")
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create ratings table
    console.log("📋 [INIT] Creating ratings table...")
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(recipe_id, user_id)
      )
    `

    // Create recipe deletions audit table
    console.log("📋 [INIT] Creating recipe_deletions table...")
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_deletions (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        recipe_title VARCHAR(255),
        recipe_author_id INTEGER,
        deleted_by INTEGER REFERENCES users(id),
        deletion_reason TEXT,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("✅ [INIT] All tables created successfully")

    // Check if owner account exists
    console.log("👤 [INIT] Checking for owner account...")
    const existingOwner = await sql`
      SELECT id, username, email, role
      FROM users
      WHERE email = 'aaronhirshka@gmail.com'
    `

    if (existingOwner.length > 0) {
      console.log("✅ [INIT] Owner account already exists:", {
        id: existingOwner[0].id,
        username: existingOwner[0].username,
        role: existingOwner[0].role,
      })
    } else {
      // Create owner account
      console.log("👤 [INIT] Creating owner account...")
      const passwordHash = await bcrypt.hash("Morton2121", 12)

      await sql`
        INSERT INTO users (username, email, password_hash, role, status, is_verified)
        VALUES ('admin', 'aaronhirshka@gmail.com', ${passwordHash}, 'owner', 'active', true)
      `

      console.log("✅ [INIT] Owner account created successfully")
    }

    // Add some sample data if tables are empty
    console.log("📊 [INIT] Checking for sample data...")
    const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
    const totalRecipes = Number.parseInt(recipeCount[0].count)

    if (totalRecipes === 0) {
      console.log("📊 [INIT] Adding sample recipes...")

      // Get owner ID
      const owner = await sql`SELECT id FROM users WHERE email = 'aaronhirshka@gmail.com'`
      const ownerId = owner[0].id

      // Add sample recipes
      await sql`
        INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings, difficulty, tags, author_id, status)
        VALUES 
        (
          'Classic Chocolate Chip Cookies',
          'Delicious homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
          '["2 1/4 cups all-purpose flour", "1 tsp baking soda", "1 tsp salt", "1 cup butter, softened", "3/4 cup granulated sugar", "3/4 cup brown sugar", "2 large eggs", "2 tsp vanilla extract", "2 cups chocolate chips"]',
          '["Preheat oven to 375°F", "Mix flour, baking soda, and salt in a bowl", "Cream butter and sugars until fluffy", "Beat in eggs and vanilla", "Gradually add flour mixture", "Stir in chocolate chips", "Drop rounded tablespoons onto ungreased baking sheets", "Bake 9-11 minutes until golden brown"]',
          15,
          10,
          24,
          'easy',
          '["dessert", "cookies", "chocolate", "baking"]',
          ${ownerId},
          'approved'
        ),
        (
          'Spaghetti Carbonara',
          'A classic Italian pasta dish with eggs, cheese, and pancetta.',
          '["1 lb spaghetti", "6 oz pancetta, diced", "4 large eggs", "1 cup Parmesan cheese, grated", "1/2 cup Pecorino Romano cheese", "Black pepper", "Salt"]',
          '["Cook spaghetti according to package directions", "Cook pancetta until crispy", "Whisk eggs with cheeses and pepper", "Drain pasta, reserving 1 cup pasta water", "Toss hot pasta with pancetta", "Remove from heat and quickly stir in egg mixture", "Add pasta water as needed for creaminess", "Serve immediately"]',
          10,
          15,
          4,
          'medium',
          '["pasta", "italian", "dinner", "quick"]',
          ${ownerId},
          'approved'
        )
      `

      console.log("✅ [INIT] Sample recipes added")
    }

    console.log("🎉 [INIT] System initialization completed successfully")

    return NextResponse.json({
      success: true,
      message: "System initialized successfully",
      details: {
        tablesCreated: [
          "users",
          "user_sessions",
          "recipes",
          "pending_recipes",
          "rejected_recipes",
          "comments",
          "ratings",
          "recipe_deletions",
        ],
        ownerAccount: {
          email: "aaronhirshka@gmail.com",
          password: "Morton2121",
          role: "owner",
        },
        sampleDataAdded: totalRecipes === 0,
      },
    })
  } catch (error) {
    console.error("❌ [INIT] Initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize system",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
