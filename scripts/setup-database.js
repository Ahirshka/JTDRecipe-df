const { sql } = require("@neondatabase/serverless")

async function setupDatabase() {
  console.log("🗄️ Setting up database...")

  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL environment variable is required")
      console.log("Please set up your Neon database connection first")
      return
    }

    console.log("✅ Database connection configured")

    // Test database connection
    console.log("🔌 Testing database connection...")
    const testResult = await sql`SELECT 1 as test`
    console.log("✅ Database connection successful")

    // Initialize database schema
    console.log("📋 Creating database schema...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        avatar TEXT,
        provider VARCHAR(50) NOT NULL DEFAULT 'email',
        social_id TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'owner')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending')),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("✅ Users table created")

    // Create recipes table
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
        prep_time_minutes INTEGER DEFAULT 0,
        cook_time_minutes INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 1,
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT FALSE,
        moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("✅ Recipes table created")

    // Create recipe ingredients table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        ingredient VARCHAR(255) NOT NULL,
        amount VARCHAR(50),
        unit VARCHAR(50),
        order_index INTEGER DEFAULT 0
      )
    `
    console.log("✅ Recipe ingredients table created")

    // Create recipe instructions table
    await sql`
      CREATE TABLE IF NOT EXISTS recipe_instructions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        instruction TEXT NOT NULL,
        step_number INTEGER NOT NULL
      )
    `
    console.log("✅ Recipe instructions table created")

    // Create user sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log("✅ User sessions table created")

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_author ON recipes(author_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(moderation_status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_recipes_published ON recipes(is_published)`
    await sql`CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token)`
    console.log("✅ Database indexes created")

    // Check if we need to create sample data
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    const recipeCount = await sql`SELECT COUNT(*) as count FROM recipes`

    if (userCount[0].count === 0) {
      console.log("👤 Creating sample admin user...")
      const adminUser = await sql`
        INSERT INTO users (username, email, role, is_verified)
        VALUES ('admin', 'admin@jtdrecipe.com', 'admin', true)
        RETURNING id
      `
      console.log("✅ Admin user created")

      if (recipeCount[0].count === 0) {
        console.log("🍳 Creating sample recipes...")

        // Sample recipe 1
        const recipe1 = await sql`
          INSERT INTO recipes (
            title, description, author_id, category, difficulty,
            prep_time_minutes, cook_time_minutes, servings,
            moderation_status, is_published, rating, review_count, view_count
          ) VALUES (
            'Classic Chocolate Chip Cookies',
            'Perfect chewy chocolate chip cookies that everyone will love.',
            ${adminUser[0].id}, 'Desserts', 'Easy',
            15, 12, 24,
            'approved', true, 4.8, 156, 2341
          ) RETURNING id
        `

        // Add ingredients for recipe 1
        await sql`
          INSERT INTO recipe_ingredients (recipe_id, ingredient, amount, unit, order_index)
          VALUES 
            (${recipe1[0].id}, 'All-purpose flour', '2 1/4', 'cups', 0),
            (${recipe1[0].id}, 'Baking soda', '1', 'tsp', 1),
            (${recipe1[0].id}, 'Salt', '1', 'tsp', 2),
            (${recipe1[0].id}, 'Butter, softened', '1', 'cup', 3),
            (${recipe1[0].id}, 'Granulated sugar', '3/4', 'cup', 4),
            (${recipe1[0].id}, 'Brown sugar', '3/4', 'cup', 5),
            (${recipe1[0].id}, 'Vanilla extract', '2', 'tsp', 6),
            (${recipe1[0].id}, 'Large eggs', '2', 'whole', 7),
            (${recipe1[0].id}, 'Chocolate chips', '2', 'cups', 8)
        `

        // Add instructions for recipe 1
        await sql`
          INSERT INTO recipe_instructions (recipe_id, instruction, step_number)
          VALUES 
            (${recipe1[0].id}, 'Preheat oven to 375°F (190°C).', 1),
            (${recipe1[0].id}, 'In a small bowl, combine flour, baking soda, and salt.', 2),
            (${recipe1[0].id}, 'In a large bowl, beat butter and both sugars until creamy.', 3),
            (${recipe1[0].id}, 'Beat in vanilla and eggs one at a time.', 4),
            (${recipe1[0].id}, 'Gradually blend in flour mixture.', 5),
            (${recipe1[0].id}, 'Stir in chocolate chips.', 6),
            (${recipe1[0].id}, 'Drop rounded tablespoons of dough onto ungreased cookie sheets.', 7),
            (${recipe1[0].id}, 'Bake 9-11 minutes or until golden brown.', 8),
            (${recipe1[0].id}, 'Cool on baking sheets for 2 minutes; remove to wire rack.', 9)
        `

        console.log("✅ Sample recipes created")
      }
    }

    console.log("🎉 Database setup completed successfully!")
    console.log("")
    console.log("📊 Database Summary:")
    console.log(`👥 Users: ${userCount[0].count}`)
    console.log(`🍳 Recipes: ${recipeCount[0].count}`)
    console.log("")
    console.log("🚀 Your recipe site is ready!")
    console.log("🌐 Visit your deployed site to test the functionality")
  } catch (error) {
    console.error("❌ Database setup failed:", error)
    console.log("")
    console.log("🔧 Troubleshooting:")
    console.log("1. Verify DATABASE_URL is set correctly")
    console.log("2. Check Neon database connection")
    console.log("3. Ensure database permissions are correct")
    process.exit(1)
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase()
}

module.exports = { setupDatabase }
