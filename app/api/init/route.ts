import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function POST() {
  console.log("🚀 [INIT] Starting system initialization...")

  try {
    // Create users table
    console.log("👥 [INIT] Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        is_profile_verified BOOLEAN DEFAULT false,
        warning_count INTEGER DEFAULT 0,
        suspension_reason TEXT,
        suspension_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create user_sessions table
    console.log("🔐 [INIT] Creating user_sessions table...")
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
    console.log("🍳 [INIT] Creating recipes table...")
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
        moderation_status VARCHAR(50) DEFAULT 'pending',
        moderated_by INTEGER REFERENCES users(id),
        moderated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create pending_recipes table
    console.log("⏳ [INIT] Creating pending_recipes table...")
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

    // Create rejected_recipes table
    console.log("❌ [INIT] Creating rejected_recipes table...")
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
    console.log("💬 [INIT] Creating comments table...")
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        is_flagged BOOLEAN DEFAULT false,
        flagged_by INTEGER REFERENCES users(id),
        flagged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create ratings table
    console.log("⭐ [INIT] Creating ratings table...")
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

    // Create email_tokens table
    console.log("📧 [INIT] Creating email_tokens table...")
    await sql`
      CREATE TABLE IF NOT EXISTS email_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    console.log("✅ [INIT] All tables created successfully")

    // Check if owner account already exists
    console.log("👑 [INIT] Checking for existing owner account...")
    const existingOwner = await sql`
      SELECT id, username, email, role 
      FROM users 
      WHERE role = 'owner'
    `

    if (existingOwner.length > 0) {
      console.log("✅ [INIT] Owner account already exists:", {
        id: existingOwner[0].id,
        username: existingOwner[0].username,
        email: existingOwner[0].email,
      })

      return NextResponse.json({
        success: true,
        message: "System already initialized",
        owner: {
          id: existingOwner[0].id,
          username: existingOwner[0].username,
          email: existingOwner[0].email,
          role: existingOwner[0].role,
        },
      })
    }

    // Create owner account
    console.log("👑 [INIT] Creating owner account...")
    const ownerEmail = "aaronhirshka@gmail.com"
    const ownerUsername = "aaronhirshka"
    const ownerPassword = "Morton2121"

    const passwordHash = await bcrypt.hash(ownerPassword, 12)

    const newOwner = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified, 
        is_profile_verified
      )
      VALUES (
        ${ownerUsername}, 
        ${ownerEmail}, 
        ${passwordHash}, 
        'owner', 
        'active', 
        true, 
        true
      )
      RETURNING id, username, email, role, status, is_verified, created_at
    `

    console.log("✅ [INIT] Owner account created successfully:", {
      id: newOwner[0].id,
      username: newOwner[0].username,
      email: newOwner[0].email,
      role: newOwner[0].role,
    })

    // Create some sample data
    console.log("📝 [INIT] Creating sample data...")

    // Create a sample admin user
    const adminPasswordHash = await bcrypt.hash("admin123", 12)
    const sampleAdmin = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified, 
        is_profile_verified
      )
      VALUES (
        'admin', 
        'admin@recipe-site.com', 
        ${adminPasswordHash}, 
        'admin', 
        'active', 
        true, 
        true
      )
      RETURNING id, username, email, role
    `

    // Create a sample moderator user
    const modPasswordHash = await bcrypt.hash("mod123", 12)
    const sampleMod = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified, 
        is_profile_verified
      )
      VALUES (
        'moderator', 
        'mod@recipe-site.com', 
        ${modPasswordHash}, 
        'moderator', 
        'active', 
        true, 
        true
      )
      RETURNING id, username, email, role
    `

    // Create a sample regular user
    const userPasswordHash = await bcrypt.hash("user123", 12)
    const sampleUser = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified, 
        is_profile_verified
      )
      VALUES (
        'testuser', 
        'user@recipe-site.com', 
        ${userPasswordHash}, 
        'user', 
        'active', 
        true, 
        true
      )
      RETURNING id, username, email, role
    `

    console.log("✅ [INIT] Sample users created:", {
      admin: sampleAdmin[0].username,
      moderator: sampleMod[0].username,
      user: sampleUser[0].username,
    })

    // Create sample recipes
    const sampleRecipe1 = await sql`
      INSERT INTO recipes (
        title,
        description,
        ingredients,
        instructions,
        prep_time,
        cook_time,
        servings,
        difficulty,
        tags,
        author_id,
        status,
        moderation_status
      )
      VALUES (
        'Classic Chocolate Chip Cookies',
        'Delicious homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
        '["2 1/4 cups all-purpose flour", "1 tsp baking soda", "1 tsp salt", "1 cup butter, softened", "3/4 cup granulated sugar", "3/4 cup brown sugar", "2 large eggs", "2 tsp vanilla extract", "2 cups chocolate chips"]',
        '["Preheat oven to 375°F", "Mix flour, baking soda, and salt in a bowl", "Cream butter and sugars", "Beat in eggs and vanilla", "Gradually add flour mixture", "Stir in chocolate chips", "Drop spoonfuls on baking sheet", "Bake 9-11 minutes"]',
        15,
        10,
        24,
        'easy',
        '["dessert", "cookies", "chocolate", "baking"]',
        ${newOwner[0].id},
        'approved',
        'approved'
      )
      RETURNING id, title
    `

    const sampleRecipe2 = await sql`
      INSERT INTO recipes (
        title,
        description,
        ingredients,
        instructions,
        prep_time,
        cook_time,
        servings,
        difficulty,
        tags,
        author_id,
        status,
        moderation_status
      )
      VALUES (
        'Spaghetti Carbonara',
        'A classic Italian pasta dish with eggs, cheese, and pancetta.',
        '["1 lb spaghetti", "6 oz pancetta, diced", "4 large eggs", "1 cup Parmesan cheese, grated", "2 cloves garlic, minced", "Salt and pepper to taste", "Fresh parsley for garnish"]',
        '["Cook spaghetti according to package directions", "Cook pancetta until crispy", "Whisk eggs and cheese together", "Drain pasta, reserve 1 cup pasta water", "Toss hot pasta with pancetta", "Remove from heat, add egg mixture", "Toss quickly, adding pasta water as needed", "Season and serve immediately"]',
        10,
        15,
        4,
        'medium',
        '["pasta", "italian", "dinner", "eggs", "cheese"]',
        ${sampleAdmin[0].id},
        'approved',
        'approved'
      )
      RETURNING id, title
    `

    console.log("✅ [INIT] Sample recipes created:", {
      recipe1: sampleRecipe1[0].title,
      recipe2: sampleRecipe2[0].title,
    })

    console.log("🎉 [INIT] System initialization completed successfully!")

    return NextResponse.json({
      success: true,
      message: "System initialized successfully",
      data: {
        owner: {
          id: newOwner[0].id,
          username: newOwner[0].username,
          email: newOwner[0].email,
          role: newOwner[0].role,
          password: ownerPassword, // Only for initial setup
        },
        sampleUsers: {
          admin: { username: "admin", email: "admin@recipe-site.com", password: "admin123" },
          moderator: { username: "moderator", email: "mod@recipe-site.com", password: "mod123" },
          user: { username: "testuser", email: "user@recipe-site.com", password: "user123" },
        },
        sampleRecipes: [
          { id: sampleRecipe1[0].id, title: sampleRecipe1[0].title },
          { id: sampleRecipe2[0].id, title: sampleRecipe2[0].title },
        ],
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
