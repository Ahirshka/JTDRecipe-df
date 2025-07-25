import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

// Configure neon to use fetch polyfill
neonConfig.fetchConnectionCache = true

// Initialize database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)
export const db = drizzle(sql)

// User interface - Updated to match database schema
export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  role: string
  status: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

// Session interface
export interface Session {
  id: number
  user_id: number
  token: string
  expires: string
  created_at: string
}

// Recipe interface - Updated to match exact database schema
export interface Recipe {
  id: string
  title: string
  description?: string | null
  author_id: number
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string | null
  ingredients: string[]
  instructions: string[]
  tags: string[]
  rating: number
  review_count: number
  view_count: number
  moderation_status: string
  moderation_notes?: string | null
  is_published: boolean
  created_at: string
  updated_at: string
  search_vector?: string
}

// Recipe creation data interface
export interface RecipeCreateData {
  title: string
  description?: string | null
  author_id: number
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string | null
  ingredients: string[]
  instructions: string[]
  tags: string[]
}

// Stack Auth Config interface
export interface StackAuthConfig {
  projectId: string
  clientUrl: string
  serverUrl: string
}

// Owner configuration - Updated with new credentials
export const OWNER_CONFIG = {
  username: "aaronhirshka",
  email: "aaronhirshka@gmail.com",
  password: "Morton2121",
  role: "owner",
}

// Get Stack Auth configuration
export function getStackAuthConfig(): StackAuthConfig {
  console.log("🔧 [NEON] Getting Stack Auth configuration")

  return {
    projectId: process.env.STACK_PROJECT_ID || "",
    clientUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    serverUrl: process.env.STACK_API_URL || "https://api.stack-auth.com",
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}

// Drop all tables and recreate
export async function reinitializeDatabase(): Promise<boolean> {
  console.log("🔄 [NEON-DB] Reinitializing database (dropping and recreating tables)...")

  try {
    // Drop tables in correct order (due to foreign key constraints)
    console.log("🗑️ [NEON-DB] Dropping existing tables...")

    await sql`DROP TABLE IF EXISTS sessions CASCADE;`
    await sql`DROP TABLE IF EXISTS recipes CASCADE;`
    await sql`DROP TABLE IF EXISTS users CASCADE;`

    // Drop functions and triggers
    await sql`DROP FUNCTION IF EXISTS recipes_search_update() CASCADE;`

    console.log("✅ [NEON-DB] All tables dropped successfully")

    // Now create fresh tables
    return await initializeDatabase()
  } catch (error) {
    console.error("❌ [NEON-DB] Database reinitialization error:", error)
    throw error
  }
}

// Initialize database tables
export async function initializeDatabase(): Promise<boolean> {
  console.log("🔄 [NEON-DB] Initializing database tables...")

  try {
    // Create users table with proper field types - FIXED column name
    console.log("📋 [NEON-DB] Creating users table...")
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        is_verified BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `
    console.log("✅ [NEON-DB] Users table created")

    // Create sessions table
    console.log("📋 [NEON-DB] Creating sessions table...")
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `
    console.log("✅ [NEON-DB] Sessions table created")

    // Create recipes table with exact schema matching
    console.log("📋 [NEON-DB] Creating recipes table...")
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
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        search_vector TSVECTOR
      );
    `

    // Add search index
    console.log("📋 [NEON-DB] Creating search index...")
    await sql`
      CREATE INDEX IF NOT EXISTS recipe_search_idx ON recipes USING GIN(search_vector);
    `

    // Add other useful indexes
    await sql`
      CREATE INDEX IF NOT EXISTS recipe_author_idx ON recipes(author_id);
      CREATE INDEX IF NOT EXISTS recipe_category_idx ON recipes(category);
      CREATE INDEX IF NOT EXISTS recipe_status_idx ON recipes(moderation_status);
      CREATE INDEX IF NOT EXISTS recipe_published_idx ON recipes(is_published);
      CREATE INDEX IF NOT EXISTS recipe_created_idx ON recipes(created_at);
    `

    // Add trigger to update search_vector - FIXED: Handle existing triggers
    console.log("📋 [NEON-DB] Creating search trigger...")

    // Drop existing trigger and function first
    await sql`DROP TRIGGER IF EXISTS recipes_search_update_trigger ON recipes;`
    await sql`DROP FUNCTION IF EXISTS recipes_search_update();`

    // Create function
    await sql`
      CREATE OR REPLACE FUNCTION recipes_search_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(NEW.difficulty, '')), 'D') ||
          setweight(to_tsvector('english', coalesce(array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.tags)), ' ', '')), 'D');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `

    // Create trigger
    await sql`
      CREATE TRIGGER recipes_search_update_trigger
      BEFORE INSERT OR UPDATE ON recipes
      FOR EACH ROW EXECUTE FUNCTION recipes_search_update();
    `

    console.log("✅ [NEON-DB] Recipes table created with search functionality")

    console.log("✅ [NEON-DB] Database tables initialized successfully")
    return true
  } catch (error) {
    console.error("❌ [NEON-DB] Database initialization error:", error)
    throw error
  }
}

// Create owner account with configurable credentials
export async function createOwnerAccount(ownerData?: {
  username?: string
  email?: string
  password?: string
  role?: string
}) {
  console.log("🔄 [NEON-DB] Creating owner account...")

  try {
    // Use provided data or defaults
    const owner = {
      username: ownerData?.username || OWNER_CONFIG.username,
      email: ownerData?.email || OWNER_CONFIG.email,
      password: ownerData?.password || OWNER_CONFIG.password,
      role: ownerData?.role || OWNER_CONFIG.role,
    }

    console.log("👤 [NEON-DB] Owner account details:", {
      username: owner.username,
      email: owner.email,
      role: owner.role,
    })

    // Delete any existing owner account to ensure clean state
    await sql`DELETE FROM users WHERE email = ${owner.email} OR username = ${owner.username};`
    console.log("🗑️ [NEON-DB] Cleared any existing owner account")

    // Hash the password with high salt rounds for security
    console.log("🔐 [NEON-DB] Hashing password...")
    const hashedPassword = await bcrypt.hash(owner.password, 12)
    console.log("✅ [NEON-DB] Password hashed successfully")

    // Create owner account - FIXED column name
    const result = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified
      )
      VALUES (
        ${owner.username}, 
        ${owner.email}, 
        ${hashedPassword},
        ${owner.role}, 
        'active', 
        true
      )
      RETURNING id, username, email, role, status, is_verified, created_at;
    `

    if (result.length === 0) {
      throw new Error("Failed to insert owner account")
    }

    const createdOwner = result[0]
    console.log("✅ [NEON-DB] Owner account created successfully:", {
      id: createdOwner.id,
      username: createdOwner.username,
      email: createdOwner.email,
      role: createdOwner.role,
    })

    // Verify the password was stored correctly
    const testUser = await findUserByEmail(owner.email)
    if (testUser) {
      const testVerify = await bcrypt.compare(owner.password, testUser.password_hash)
      console.log("🔍 [NEON-DB] Password verification test:", testVerify ? "PASSED" : "FAILED")

      if (!testVerify) {
        console.error("❌ [NEON-DB] Password verification failed immediately after creation!")
      }
    }

    return {
      success: true,
      message: "Owner account created successfully",
      user: createdOwner,
      credentials: {
        email: owner.email,
        password: owner.password,
      },
    }
  } catch (error) {
    console.error("❌ [NEON-DB] Create owner account error:", error)
    return {
      success: false,
      error: `Failed to create owner account: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Create test user account
export async function createTestUser() {
  console.log("🔄 [NEON-DB] Creating test user account...")

  try {
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      password: "testpass123",
      role: "user",
    }

    // Delete any existing test user
    await sql`DELETE FROM users WHERE email = ${testUser.email} OR username = ${testUser.username};`
    console.log("🗑️ [NEON-DB] Cleared any existing test user")

    // Hash the password
    console.log("🔐 [NEON-DB] Hashing test user password...")
    const hashedPassword = await bcrypt.hash(testUser.password, 12)
    console.log("✅ [NEON-DB] Test user password hashed successfully")

    // Create test user account
    const result = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified
      )
      VALUES (
        ${testUser.username}, 
        ${testUser.email}, 
        ${hashedPassword},
        ${testUser.role}, 
        'active', 
        true
      )
      RETURNING id, username, email, role, status, is_verified, created_at;
    `

    if (result.length === 0) {
      throw new Error("Failed to insert test user account")
    }

    const createdUser = result[0]
    console.log("✅ [NEON-DB] Test user account created successfully:", {
      id: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
      role: createdUser.role,
    })

    return {
      success: true,
      message: "Test user account created successfully",
      user: createdUser,
      credentials: {
        email: testUser.email,
        password: testUser.password,
      },
    }
  } catch (error) {
    console.error("❌ [NEON-DB] Create test user error:", error)
    return {
      success: false,
      error: `Failed to create test user: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  console.log(`🔄 [NEON-DB] Finding user by email: ${email}`)

  try {
    const users = await sql`
      SELECT * FROM users WHERE email = ${email};
    `

    if (users.length === 0) {
      console.log(`❌ [NEON-DB] User not found with email: ${email}`)
      return null
    }

    const user = users[0] as User
    console.log(`✅ [NEON-DB] User found: ${user.username} (ID: ${user.id})`)
    console.log(`🔍 [NEON-DB] User has password hash: ${user.password_hash ? "YES" : "NO"}`)
    if (user.password_hash) {
      console.log(`🔍 [NEON-DB] Password hash length: ${user.password_hash.length}`)
      console.log(`🔍 [NEON-DB] Password hash starts with: ${user.password_hash.substring(0, 10)}`)
    }

    return user
  } catch (error) {
    console.error(`❌ [NEON-DB] Error finding user by email:`, error)
    throw error
  }
}

// Find user by username
export async function findUserByUsername(username: string): Promise<User | null> {
  console.log("🔍 [NEON] Finding user by username:", username)

  try {
    const result = await sql`
      SELECT * FROM users 
      WHERE username = ${username}
      LIMIT 1
    `

    if (result.length === 0) {
      console.log("❌ [NEON] User not found by username")
      return null
    }

    const user = result[0] as User
    console.log("✅ [NEON] User found by username:", {
      id: user.id,
      email: user.email,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error("❌ [NEON] Error finding user by username:", error)
    throw error
  }
}

// Find user by ID
export async function findUserById(id: number): Promise<User | null> {
  console.log(`🔄 [NEON-DB] Finding user by ID: ${id}`)

  try {
    const users = await sql`
      SELECT * FROM users WHERE id = ${id};
    `

    if (users.length === 0) {
      console.log(`❌ [NEON-DB] User not found with ID: ${id}`)
      return null
    }

    console.log(`✅ [NEON-DB] User found: ${users[0].username}`)
    return users[0] as User
  } catch (error) {
    console.error(`❌ [NEON-DB] Error finding user by ID:`, error)
    throw error
  }
}

// Create user
export async function createUser(userData: {
  username: string
  email: string
  password: string
  role?: string
  status?: string
  is_verified?: boolean
}): Promise<User | null> {
  console.log("👤 [NEON] Creating user:", userData.username)

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const result = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified
      )
      VALUES (
        ${userData.username}, 
        ${userData.email}, 
        ${hashedPassword}, 
        ${userData.role || "user"}, 
        ${userData.status || "active"}, 
        ${userData.is_verified || false}
      )
      RETURNING *
    `

    if (result.length === 0) {
      console.log("❌ [NEON] Failed to create user")
      return null
    }

    const user = result[0] as User
    console.log("✅ [NEON] User created successfully:", {
      id: user.id,
      username: user.username,
      email: user.email,
    })

    return user
  } catch (error) {
    console.error("❌ [NEON] Error creating user:", error)
    throw error
  }
}

// Verify user password
export async function verifyUserPassword(user: any, password: string): Promise<boolean> {
  console.log(`🔄 [NEON-DB] Verifying password for user: ${user.username}`)
  console.log(`🔍 [NEON-DB] Input password: "${password}"`)
  console.log(
    `🔍 [NEON-DB] Stored hash: "${user.password_hash ? user.password_hash.substring(0, 20) + "..." : "NO HASH"}"`,
  )

  try {
    if (!user.password_hash) {
      console.log(`❌ [NEON-DB] No password hash found for user: ${user.username}`)
      return false
    }

    // Use bcrypt to compare the plain password with the hash
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (isValid) {
      console.log(`✅ [NEON-DB] Password verified successfully for user: ${user.username}`)
    } else {
      console.log(`❌ [NEON-DB] Password verification failed for user: ${user.username}`)
      console.log(
        `🔍 [NEON-DB] bcrypt.compare("${password}", "${user.password_hash.substring(0, 20)}...") = ${isValid}`,
      )
    }

    return isValid
  } catch (error) {
    console.error(`❌ [NEON-DB] Error verifying password:`, error)
    return false
  }
}

// Create session
export async function createSession(userId: number): Promise<{ token: string; expires: Date } | null> {
  console.log(`🔄 [NEON-DB] Creating session for user ID: ${userId}`)

  try {
    // Generate random token
    const token = randomBytes(32).toString("hex")

    // Set expiration to 7 days from now
    const expires = new Date()
    expires.setDate(expires.getDate() + 7)

    // Create session in database
    await sql`
      INSERT INTO sessions (user_id, token, expires)
      VALUES (${userId}, ${token}, ${expires.toISOString()});
    `

    console.log(`✅ [NEON-DB] Session created for user ID: ${userId}`)

    return {
      token,
      expires,
    }
  } catch (error) {
    console.error(`❌ [NEON-DB] Error creating session:`, error)
    throw error
  }
}

// Find session by token
export async function findSessionByToken(token: string): Promise<Session | null> {
  console.log(`🔄 [NEON-DB] Finding session by token: ${token.substring(0, 10)}...`)

  try {
    // Find session and check if it's expired
    const sessions = await sql`
      SELECT * FROM sessions 
      WHERE token = ${token}
      AND expires > NOW();
    `

    if (sessions.length === 0) {
      console.log(`❌ [NEON-DB] Session not found or expired: ${token.substring(0, 10)}...`)
      return null
    }

    console.log(`✅ [NEON-DB] Valid session found for user ID: ${sessions[0].user_id}`)
    return sessions[0] as Session
  } catch (error) {
    console.error(`❌ [NEON-DB] Error finding session:`, error)
    throw error
  }
}

// Validate session - ADDED MISSING EXPORT
export async function validateSession(token: string): Promise<{ user: User; session: Session } | null> {
  console.log(`🔄 [NEON-DB] Validating session token: ${token.substring(0, 10)}...`)

  try {
    // Find session by token
    const session = await findSessionByToken(token)
    if (!session) {
      console.log(`❌ [NEON-DB] Session validation failed: session not found`)
      return null
    }

    // Find user by session user_id
    const user = await findUserById(session.user_id)
    if (!user) {
      console.log(`❌ [NEON-DB] Session validation failed: user not found`)
      return null
    }

    console.log(`✅ [NEON-DB] Session validated successfully for user: ${user.username}`)
    return { user, session }
  } catch (error) {
    console.error(`❌ [NEON-DB] Error validating session:`, error)
    return null
  }
}

// Delete session by token
export async function deleteSessionByToken(token: string): Promise<boolean> {
  console.log("🗑️ [NEON] Deleting session by token:", token.substring(0, 10) + "...")

  try {
    const result = await sql`
      DELETE FROM sessions 
      WHERE token = ${token}
    `

    console.log("✅ [NEON] Session deletion result:", result)
    return true
  } catch (error) {
    console.error("❌ [NEON] Error deleting session:", error)
    return false
  }
}

// Delete session (alias for deleteSessionByToken)
export async function deleteSession(token: string): Promise<boolean> {
  return await deleteSessionByToken(token)
}

// Update user
export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  console.log("📝 [NEON] Updating user ID:", id)

  try {
    // Build dynamic update query
    const updateFields = Object.keys(updates)
      .filter((key) => updates[key as keyof User] !== undefined)
      .map((key) => `${key} = $${key}`)
      .join(", ")

    if (updateFields.length === 0) {
      console.log("❌ [NEON] No fields to update")
      return null
    }

    // Add updated_at timestamp
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const result = await sql`
      UPDATE users 
      SET ${sql(updatedData)}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      console.log("❌ [NEON] User not found for update")
      return null
    }

    const user = result[0] as User
    console.log("✅ [NEON] User updated successfully:", {
      id: user.id,
      username: user.username,
    })

    return user
  } catch (error) {
    console.error("❌ [NEON] Error updating user:", error)
    throw error
  }
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  console.log("📋 [NEON] Getting all users")

  try {
    const result = await sql`
      SELECT * FROM users 
      ORDER BY created_at DESC
    `

    const users = result as User[]
    console.log("✅ [NEON] Retrieved users count:", users.length)

    return users
  } catch (error) {
    console.error("❌ [NEON] Error getting all users:", error)
    throw error
  }
}

// Create recipe with proper JSONB handling
export async function createRecipe(
  recipeData: RecipeCreateData,
): Promise<{ success: boolean; recipeId?: string; error?: string } | null> {
  console.log("🔄 [NEON-DB] Creating recipe:", recipeData.title)

  try {
    // Generate unique ID
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    console.log("📝 [NEON-DB] Recipe data to insert:", {
      id: recipeId,
      title: recipeData.title,
      author_id: recipeData.author_id,
      author_username: recipeData.author_username,
      category: recipeData.category,
      difficulty: recipeData.difficulty,
      prep_time: recipeData.prep_time_minutes,
      cook_time: recipeData.cook_time_minutes,
      servings: recipeData.servings,
      ingredients_count: recipeData.ingredients.length,
      instructions_count: recipeData.instructions.length,
      tags_count: recipeData.tags.length,
    })

    // Validate JSONB data before insertion
    if (!Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
      throw new Error("Ingredients must be a non-empty array")
    }

    if (!Array.isArray(recipeData.instructions) || recipeData.instructions.length === 0) {
      throw new Error("Instructions must be a non-empty array")
    }

    if (!Array.isArray(recipeData.tags)) {
      throw new Error("Tags must be an array")
    }

    // Convert arrays to JSONB strings
    const ingredientsJson = JSON.stringify(recipeData.ingredients)
    const instructionsJson = JSON.stringify(recipeData.instructions)
    const tagsJson = JSON.stringify(recipeData.tags)

    console.log("📝 [NEON-DB] JSONB data prepared:", {
      ingredients: ingredientsJson.substring(0, 100) + "...",
      instructions: instructionsJson.substring(0, 100) + "...",
      tags: tagsJson,
    })

    // Insert recipe with explicit JSONB casting
    const result = await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, 
        category, difficulty, prep_time_minutes, cook_time_minutes, 
        servings, image_url, ingredients, instructions, tags,
        moderation_status, is_published, rating, review_count, view_count
      ) VALUES (
        ${recipeId}, 
        ${recipeData.title}, 
        ${recipeData.description}, 
        ${recipeData.author_id}, 
        ${recipeData.author_username},
        ${recipeData.category}, 
        ${recipeData.difficulty}, 
        ${recipeData.prep_time_minutes}, 
        ${recipeData.cook_time_minutes}, 
        ${recipeData.servings}, 
        ${recipeData.image_url},
        ${ingredientsJson}::jsonb, 
        ${instructionsJson}::jsonb, 
        ${tagsJson}::jsonb,
        'pending', 
        false, 
        0, 
        0, 
        0
      )
      RETURNING id, title, moderation_status, created_at;
    `

    if (result.length === 0) {
      throw new Error("Failed to insert recipe - no result returned")
    }

    const insertedRecipe = result[0]
    console.log(`✅ [NEON-DB] Recipe created successfully:`, {
      id: insertedRecipe.id,
      title: insertedRecipe.title,
      status: insertedRecipe.moderation_status,
      created_at: insertedRecipe.created_at,
    })

    return {
      success: true,
      recipeId: insertedRecipe.id,
    }
  } catch (error) {
    console.error("❌ [NEON-DB] Error creating recipe:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}

// Get recipes
export async function getRecipes(limit = 20, offset = 0): Promise<Recipe[]> {
  console.log("📋 [NEON] Getting recipes with limit:", limit, "offset:", offset)

  try {
    const result = await sql`
      SELECT * FROM recipes
      WHERE moderation_status = 'approved' 
        AND is_published = true
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `

    const recipes = result as Recipe[]
    console.log(`✅ [NEON] Retrieved ${recipes.length} recipes`)
    return recipes
  } catch (error) {
    console.error("❌ [NEON] Error getting recipes:", error)
    throw error
  }
}

// Get recipe by ID
export async function getRecipeById(id: string): Promise<Recipe | null> {
  console.log("🔍 [NEON] Getting recipe by ID:", id)

  try {
    const result = await sql`
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.id = ${id}
      LIMIT 1
    `

    if (result.length === 0) {
      console.log("❌ [NEON] Recipe not found")
      return null
    }

    const recipe = result[0] as Recipe
    console.log("✅ [NEON] Recipe found:", {
      id: recipe.id,
      title: recipe.title,
    })

    return recipe
  } catch (error) {
    console.error("❌ [NEON] Error getting recipe by ID:", error)
    throw error
  }
}

// Get pending recipes for moderation
export async function getPendingRecipes(): Promise<Recipe[]> {
  console.log("📋 [NEON] Getting pending recipes for moderation")

  try {
    const result = await sql`
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at ASC
    `

    const recipes = result as Recipe[]
    console.log(`✅ [NEON] Retrieved ${recipes.length} pending recipes`)

    return recipes
  } catch (error) {
    console.error("❌ [NEON] Error getting pending recipes:", error)
    throw error
  }
}

// Moderate recipe (approve/reject)
export async function moderateRecipe(
  recipeId: string,
  status: "approved" | "rejected",
  notes?: string,
): Promise<{ success: boolean; message: string }> {
  console.log(`🔄 [NEON] Moderating recipe ${recipeId} with status: ${status}`)

  try {
    // Update recipe moderation status
    const result = await sql`
      UPDATE recipes 
      SET 
        moderation_status = ${status},
        moderation_notes = ${notes || null},
        is_published = ${status === "approved"},
        updated_at = NOW()
      WHERE id = ${recipeId}
      RETURNING id, title, moderation_status
    `

    if (result.length === 0) {
      console.log(`❌ [NEON] Recipe not found: ${recipeId}`)
      return {
        success: false,
        message: "Recipe not found",
      }
    }

    const recipe = result[0]
    console.log(`✅ [NEON] Recipe ${recipe.id} moderated: ${recipe.moderation_status}`)

    return {
      success: true,
      message: `Recipe "${recipe.title}" has been ${status}`,
    }
  } catch (error) {
    console.error("❌ [NEON] Error moderating recipe:", error)
    return {
      success: false,
      message: `Failed to moderate recipe: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
