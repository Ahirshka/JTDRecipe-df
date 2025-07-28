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
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_username VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes >= 0),
        cook_time_minutes INTEGER NOT NULL CHECK (cook_time_minutes >= 0),
        servings INTEGER NOT NULL CHECK (servings > 0),
        image_url TEXT,
        ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
        instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
        review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
        view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
        moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        moderation_notes TEXT,
        is_published BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // Check if owner already exists
    console.log("🔍 [INIT] Checking for existing owner...")
    const existingOwner = await sql`
      SELECT id, username, email, role 
      FROM users 
      WHERE role = 'owner' OR email = 'aaronhirshka@gmail.com'
    `

    if (existingOwner.length > 0) {
      console.log("✅ [INIT] Owner account already exists:", {
        id: existingOwner[0].id,
        username: existingOwner[0].username,
        email: existingOwner[0].email,
        role: existingOwner[0].role,
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
        credentials: {
          email: "aaronhirshka@gmail.com",
          password: "Morton2121",
        },
      })
    }

    // Create owner account
    console.log("👤 [INIT] Creating owner account...")
    const ownerPassword = "Morton2121"
    const hashedPassword = await bcrypt.hash(ownerPassword, 12)

    const ownerResult = await sql`
      INSERT INTO users (username, email, password_hash, role, status, is_verified)
      VALUES ('aaronhirshka', 'aaronhirshka@gmail.com', ${hashedPassword}, 'owner', 'active', true)
      RETURNING id, username, email, role, created_at
    `

    if (ownerResult.length === 0) {
      throw new Error("Failed to create owner account")
    }

    const owner = ownerResult[0]
    console.log("✅ [INIT] Owner account created:", {
      id: owner.id,
      username: owner.username,
      email: owner.email,
      role: owner.role,
    })

    // Create sample recipe
    console.log("🍳 [INIT] Creating sample recipe...")
    const sampleRecipeId = `recipe_${Date.now()}_sample`

    await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username,
        category, difficulty, prep_time_minutes, cook_time_minutes,
        servings, ingredients, instructions, tags,
        moderation_status, is_published
      ) VALUES (
        ${sampleRecipeId},
        'Classic Chocolate Chip Cookies',
        'Delicious homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
        ${owner.id},
        ${owner.username},
        'Desserts',
        'Easy',
        15,
        12,
        24,
        ${JSON.stringify([
          "2 1/4 cups all-purpose flour",
          "1 tsp baking soda",
          "1 tsp salt",
          "1 cup butter, softened",
          "3/4 cup granulated sugar",
          "3/4 cup brown sugar",
          "2 large eggs",
          "2 tsp vanilla extract",
          "2 cups chocolate chips",
        ])}::jsonb,
        ${JSON.stringify([
          "Preheat oven to 375°F (190°C).",
          "In a bowl, whisk together flour, baking soda, and salt.",
          "In a large bowl, cream together butter and both sugars until light and fluffy.",
          "Beat in eggs one at a time, then add vanilla.",
          "Gradually mix in the flour mixture until just combined.",
          "Stir in chocolate chips.",
          "Drop rounded tablespoons of dough onto ungreased baking sheets.",
          "Bake for 9-11 minutes or until golden brown.",
          "Cool on baking sheet for 2 minutes before transferring to wire rack.",
        ])}::jsonb,
        ${JSON.stringify(["cookies", "dessert", "chocolate", "baking"])}::jsonb,
        'approved',
        true
      )
    `

    console.log("✅ [INIT] Sample recipe created")

    console.log("🎉 [INIT] System initialization completed successfully!")

    return NextResponse.json({
      success: true,
      message: "System initialized successfully",
      owner: {
        id: owner.id,
        username: owner.username,
        email: owner.email,
        role: owner.role,
        created_at: owner.created_at,
      },
      credentials: {
        email: "aaronhirshka@gmail.com",
        password: "Morton2121",
      },
      sampleData: {
        recipesCreated: 1,
      },
    })
  } catch (error) {
    console.error("❌ [INIT] Initialization error:", error)
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
