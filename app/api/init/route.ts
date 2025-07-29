import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export const dynamic = "force-dynamic"

export async function POST() {
  console.log("🚀 [INIT] Starting system initialization...")

  try {
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
        moderation_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        is_flagged BOOLEAN DEFAULT false,
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

    console.log("✅ [INIT] All tables created successfully")

    // Check if owner account already exists
    console.log("👤 [INIT] Checking for existing owner account...")
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
    } else {
      // Create owner account
      console.log("👤 [INIT] Creating owner account...")
      const ownerPasswordHash = await bcrypt.hash("Morton2121", 12)

      await sql`
        INSERT INTO users (username, email, password_hash, role, status, is_verified)
        VALUES ('aaronhirshka', 'aaronhirshka@gmail.com', ${ownerPasswordHash}, 'owner', 'active', true)
        ON CONFLICT (email) DO UPDATE SET
          role = 'owner',
          status = 'active',
          is_verified = true,
          updated_at = CURRENT_TIMESTAMP
      `

      console.log("✅ [INIT] Owner account created/updated")
    }

    // Create sample users if they don't exist
    console.log("👥 [INIT] Creating sample users...")

    const adminPasswordHash = await bcrypt.hash("admin123", 12)
    const modPasswordHash = await bcrypt.hash("mod123", 12)
    const userPasswordHash = await bcrypt.hash("user123", 12)

    // Admin user
    await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES ('admin', 'admin@recipe-site.com', ${adminPasswordHash}, 'admin', 'active', true)
      ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        status = 'active',
        is_verified = true,
        updated_at = CURRENT_TIMESTAMP
    `

    // Moderator user
    await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES ('moderator', 'mod@recipe-site.com', ${modPasswordHash}, 'moderator', 'active', true)
      ON CONFLICT (email) DO UPDATE SET
        role = 'moderator',
        status = 'active',
        is_verified = true,
        updated_at = CURRENT_TIMESTAMP
    `

    // Regular user
    await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES ('testuser', 'user@recipe-site.com', ${userPasswordHash}, 'user', 'active', true)
      ON CONFLICT (email) DO UPDATE SET
        role = 'user',
        status = 'active',
        is_verified = true,
        updated_at = CURRENT_TIMESTAMP
    `

    console.log("✅ [INIT] Sample users created/updated")

    // Create sample recipes
    console.log("🍳 [INIT] Creating sample recipes...")

    const users = await sql`SELECT id FROM users WHERE role = 'owner' LIMIT 1`
    const ownerId = users[0]?.id

    if (ownerId) {
      await sql`
        INSERT INTO recipes (
          title, description, ingredients, instructions, 
          prep_time, cook_time, servings, difficulty, 
          tags, author_id, status, moderation_status
        )
        VALUES (
          'Classic Chocolate Chip Cookies',
          'Delicious homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
          '["2 1/4 cups all-purpose flour", "1 tsp baking soda", "1 tsp salt", "1 cup butter, softened", "3/4 cup granulated sugar", "3/4 cup brown sugar", "2 large eggs", "2 tsp vanilla extract", "2 cups chocolate chips"]',
          '["Preheat oven to 375°F", "Mix flour, baking soda, and salt in a bowl", "Cream butter and sugars", "Beat in eggs and vanilla", "Gradually add flour mixture", "Stir in chocolate chips", "Drop rounded tablespoons on ungreased cookie sheets", "Bake 9-11 minutes until golden brown"]',
          15, 10, 24, 'easy',
          '["dessert", "cookies", "chocolate", "baking"]',
          ${ownerId}, 'approved', 'approved'
        )
        ON CONFLICT DO NOTHING
      `

      await sql`
        INSERT INTO recipes (
          title, description, ingredients, instructions, 
          prep_time, cook_time, servings, difficulty, 
          tags, author_id, status, moderation_status
        )
        VALUES (
          'Spaghetti Carbonara',
          'A classic Italian pasta dish with eggs, cheese, and pancetta.',
          '["1 lb spaghetti", "6 oz pancetta, diced", "4 large eggs", "1 cup Parmesan cheese, grated", "2 cloves garlic, minced", "Salt and black pepper", "2 tbsp olive oil"]',
          '["Cook spaghetti according to package directions", "Cook pancetta until crispy", "Whisk eggs and Parmesan in a bowl", "Drain pasta, reserve 1 cup pasta water", "Toss hot pasta with pancetta", "Remove from heat, add egg mixture", "Toss quickly, adding pasta water as needed", "Season with salt and pepper"]',
          10, 15, 4, 'medium',
          '["pasta", "italian", "dinner", "eggs"]',
          ${ownerId}, 'approved', 'approved'
        )
        ON CONFLICT DO NOTHING
      `

      console.log("✅ [INIT] Sample recipes created")
    }

    // Get final counts
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`
    const commentCount = await sql`SELECT COUNT(*) as count FROM comments`

    console.log("🎉 [INIT] System initialization completed successfully!")

    return NextResponse.json({
      success: true,
      message: "System initialized successfully",
      data: {
        tablesCreated: ["users", "recipes", "comments", "ratings", "pending_recipes", "rejected_recipes"],
        accounts: {
          owner: "aaronhirshka@gmail.com / Morton2121",
          admin: "admin@recipe-site.com / admin123",
          moderator: "mod@recipe-site.com / mod123",
          user: "user@recipe-site.com / user123",
        },
        counts: {
          users: Number.parseInt(userCount[0]?.count || "0"),
          recipes: Number.parseInt(recipeCount[0]?.count || "0"),
          comments: Number.parseInt(commentCount[0]?.count || "0"),
        },
      },
    })
  } catch (error) {
    console.error("❌ [INIT] Initialization failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: "System initialization failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
