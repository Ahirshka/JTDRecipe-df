import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import bcrypt from "bcryptjs"
import { randomBytes } from "crypto"

// Configure neon to use fetch polyfill
neonConfig.fetchConnectionCache = true

// Initialize database connection
export const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)

// User interface
export interface User {
  id: number
  username: string
  email: string
  password: string
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

// Recipe interface
export interface Recipe {
  id: string
  title: string
  description?: string
  author_id: number
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  ingredients: string[]
  instructions: string[]
  tags: string[]
  rating: number
  review_count: number
  view_count: number
  moderation_status: string
  moderation_notes?: string
  is_published: boolean
  created_at: string
  updated_at: string
  search_vector: string
}

// Stack Auth Config interface
export interface StackAuthConfig {
  projectId: string
  clientUrl: string
  serverUrl: string
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

// Initialize database tables
export async function initializeDatabase(): Promise<boolean> {
  console.log("🔄 [NEON-DB] Initializing database tables...")

  try {
    // Create users table
    const usersTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `
    const usersTableExists = usersTableCheck[0].exists

    if (!usersTableExists) {
      await sql`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'user',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          is_verified BOOLEAN NOT NULL DEFAULT false,
          warning_count INTEGER DEFAULT 0,
          suspension_reason TEXT,
          suspension_expires_at TIMESTAMP,
          last_login_at TIMESTAMP,
          password_hash VARCHAR(255),
          is_profile_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `
      console.log("✅ [NEON-DB] Users table created")
    } else {
      console.log("✅ [NEON-DB] Users table already exists")

      // Check if we need to add missing columns
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;`
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;`
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_expires_at TIMESTAMP;`
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;`
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_profile_verified BOOLEAN DEFAULT false;`
        console.log("✅ [NEON-DB] Users table columns updated")
      } catch (error) {
        console.log("ℹ️ [NEON-DB] Users table columns already exist or update failed:", error)
      }
    }

    // Create sessions table
    const sessionsTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'sessions'
      );
    `
    const sessionsTableExists = sessionsTableCheck[0].exists

    if (!sessionsTableExists) {
      await sql`
        CREATE TABLE sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `
      console.log("✅ [NEON-DB] Sessions table created")
    } else {
      console.log("✅ [NEON-DB] Sessions table already exists")
    }

    // Create recipes table
    const recipesTableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'recipes'
      );
    `
    const recipesTableExists = recipesTableCheck[0].exists

    if (!recipesTableExists) {
      await sql`
        CREATE TABLE recipes (
          id VARCHAR(50) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          author_username VARCHAR(50) NOT NULL,
          category VARCHAR(50) NOT NULL,
          difficulty VARCHAR(20) NOT NULL,
          prep_time_minutes INTEGER NOT NULL,
          cook_time_minutes INTEGER NOT NULL,
          servings INTEGER NOT NULL,
          image_url TEXT,
          ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
          instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
          tags JSONB DEFAULT '[]'::jsonb,
          rating DECIMAL(3,2) DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          view_count INTEGER DEFAULT 0,
          moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
          moderation_notes TEXT,
          is_published BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          search_vector TSVECTOR
        );
      `

      // Add search index
      await sql`
        CREATE INDEX recipe_search_idx ON recipes USING GIN(search_vector);
      `

      // Add trigger to update search_vector
      await sql`
        CREATE OR REPLACE FUNCTION recipes_search_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
            setweight(to_tsvector('english', coalesce(NEW.difficulty, '')), 'D');
          RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
      `

      await sql`
        CREATE TRIGGER recipes_search_update_trigger
        BEFORE INSERT OR UPDATE ON recipes
        FOR EACH ROW EXECUTE FUNCTION recipes_search_update();
      `

      console.log("✅ [NEON-DB] Recipes table created with search functionality")
    } else {
      console.log("✅ [NEON-DB] Recipes table already exists")
    }

    console.log("✅ [NEON-DB] Database tables initialized successfully")
    return true
  } catch (error) {
    console.error("❌ [NEON-DB] Database initialization error:", error)
    throw error
  }
}

// Create owner account with correct credentials
export async function createOwnerAccount() {
  console.log("🔄 [NEON-DB] Creating owner account...")

  try {
    // Check if owner account exists with the correct email
    const ownerCheck = await sql`
      SELECT * FROM users WHERE email = 'aaronhirshka@gmail.com';
    `

    if (ownerCheck.length > 0) {
      console.log("✅ [NEON-DB] Owner account already exists")
      return {
        success: true,
        message: "Owner account already exists",
        user: {
          id: ownerCheck[0].id,
          username: ownerCheck[0].username,
          email: ownerCheck[0].email,
          role: ownerCheck[0].role,
        },
      }
    }

    // Create owner account with correct credentials
    const hashedPassword = await bcrypt.hash("Morton2121", 12)

    const result = await sql`
      INSERT INTO users (
        username, 
        email, 
        password, 
        password_hash,
        role, 
        status, 
        is_verified,
        is_profile_verified
      )
      VALUES (
        'aaronhirshka', 
        'aaronhirshka@gmail.com', 
        ${hashedPassword},
        ${hashedPassword},
        'owner', 
        'active', 
        true,
        true
      )
      RETURNING id, username, email, role;
    `

    console.log("✅ [NEON-DB] Owner account created:", result[0])

    return {
      success: true,
      message: "Owner account created successfully",
      user: result[0],
    }
  } catch (error) {
    console.error("❌ [NEON-DB] Create owner account error:", error)
    return {
      success: false,
      error: `Failed to create owner account: ${error instanceof Error ? error.message : "Unknown error"}`,
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

    console.log(`✅ [NEON-DB] User found: ${users[0].username}`)
    return users[0] as User
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
  password_hash: string
  role?: string
  status?: string
  is_verified?: boolean
}): Promise<User | null> {
  console.log("👤 [NEON] Creating user:", userData.username)

  try {
    const result = await sql`
      INSERT INTO users (
        username, 
        email, 
        password,
        password_hash, 
        role, 
        status, 
        is_verified
      )
      VALUES (
        ${userData.username}, 
        ${userData.email}, 
        ${userData.password_hash},
        ${userData.password_hash}, 
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

  try {
    // Try both password and password_hash fields for compatibility
    const passwordToCheck = user.password_hash || user.password

    if (!passwordToCheck) {
      console.log(`❌ [NEON-DB] No password hash found for user: ${user.username}`)
      return false
    }

    const isValid = await bcrypt.compare(password, passwordToCheck)

    if (isValid) {
      console.log(`✅ [NEON-DB] Password verified for user: ${user.username}`)
    } else {
      console.log(`❌ [NEON-DB] Invalid password for user: ${user.username}`)
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

// Create recipe
export async function createRecipe(recipeData: any): Promise<{ success: boolean; recipeId?: string } | null> {
  console.log("🔄 [NEON-DB] Creating recipe:", recipeData.title)

  try {
    // Generate unique ID
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Insert recipe
    await sql`
      INSERT INTO recipes (
        id, title, description, author_id, author_username, 
        category, difficulty, prep_time_minutes, cook_time_minutes, 
        servings, image_url, ingredients, instructions, tags,
        moderation_status, is_published
      ) VALUES (
        ${recipeId}, ${recipeData.title}, ${recipeData.description}, 
        ${recipeData.author_id}, ${recipeData.author_username},
        ${recipeData.category}, ${recipeData.difficulty}, 
        ${recipeData.prep_time_minutes}, ${recipeData.cook_time_minutes}, 
        ${recipeData.servings}, ${recipeData.image_url},
        ${JSON.stringify(recipeData.ingredients)}, 
        ${JSON.stringify(recipeData.instructions)}, 
        ${JSON.stringify(recipeData.tags)},
        'pending', false
      );
    `

    console.log(`✅ [NEON-DB] Recipe created with ID: ${recipeId}`)

    return {
      success: true,
      recipeId,
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
      SELECT 
        r.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'ingredient', ri.ingredient,
              'amount', ri.amount,
              'unit', ri.unit
            )
          ) FILTER (WHERE ri.ingredient IS NOT NULL), 
          '[]'::json
        ) as ingredients,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'instruction', inst.instruction,
              'step_number', inst.step_number
            )
            ORDER BY inst.step_number
          ) FILTER (WHERE inst.instruction IS NOT NULL), 
          '[]'::json
        ) as instructions,
        COALESCE(
          array_agg(DISTINCT rt.tag) FILTER (WHERE rt.tag IS NOT NULL), 
          ARRAY[]::text[]
        ) as tags
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN recipe_instructions inst ON r.id = inst.recipe_id
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      WHERE r.moderation_status = 'approved' 
        AND r.is_published = true
      GROUP BY r.id
      ORDER BY r.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `

    const recipes = result as Recipe[]
    console.log(`✅ [NEON-DB] Retrieved ${recipes.length} recipes`)
    return recipes
  } catch (error) {
    console.error("❌ [NEON-DB] Error getting recipes:", error)
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
