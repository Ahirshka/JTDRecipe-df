import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

// Configure neon to use fetch polyfill
neonConfig.fetchConnectionCache = true

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Initialize database connection
const sql_client = neon(process.env.DATABASE_URL)
// Export sql as required by other modules
export const sql = sql_client
const db = drizzle(sql_client)

// User types
export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  role: string
  status: string
  created_at: Date
  updated_at: Date
  is_verified: boolean
  verification_token?: string | null
  reset_token?: string | null
  reset_token_expires?: Date | null
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  warning_count?: number
  suspension_reason?: string
  suspension_expires_at?: Date | null
  last_login_at?: Date | null
  is_profile_verified?: boolean
}

// Recipe types
export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  prep_time: number
  cook_time: number
  servings: number
  difficulty: string
  category: string
  tags: string[]
  image_url?: string
  author_id: string
  author_name: string
  status: string
  created_at: Date
  updated_at: Date
  rating?: number
  rating_count?: number
}

// Session types
export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
}

// User functions
export async function findUserById(id: string): Promise<User | null> {
  try {
    console.log("🔍 [NEON] Finding user by ID:", id)

    const result = await sql_client`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `

    if (result && result.length > 0) {
      console.log("✅ [NEON] User found:", result[0].username)
      return result[0] as User
    }

    console.log("❌ [NEON] User not found with ID:", id)
    return null
  } catch (error) {
    console.error("❌ [NEON] Error finding user by ID:", error)
    throw error
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("🔍 [NEON] Finding user by email:", email)

    const result = await sql_client`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `

    if (result && result.length > 0) {
      console.log("✅ [NEON] User found by email")
      return result[0] as User
    }

    console.log("❌ [NEON] User not found with email:", email)
    return null
  } catch (error) {
    console.error("❌ [NEON] Error finding user by email:", error)
    throw error
  }
}

export async function findUserByUsername(username: string): Promise<User | null> {
  try {
    console.log("🔍 [NEON] Finding user by username:", username)

    const result = await sql_client`
      SELECT * FROM users WHERE username = ${username} LIMIT 1
    `

    if (result && result.length > 0) {
      console.log("✅ [NEON] User found by username")
      return result[0] as User
    }

    console.log("❌ [NEON] User not found with username:", username)
    return null
  } catch (error) {
    console.error("❌ [NEON] Error finding user by username:", error)
    throw error
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password: string
  role?: string
  status?: string
}): Promise<User> {
  try {
    console.log("🔍 [NEON] Creating new user:", userData.username)

    // Hash password
    const salt = await bcrypt.genSalt(12)
    const password_hash = await bcrypt.hash(userData.password, salt)

    // Generate verification token
    const verification_token = uuidv4()

    const now = new Date()
    const userId = uuidv4()

    const result = await sql_client`
      INSERT INTO users (
        id, username, email, password_hash, role, status, 
        created_at, updated_at, is_verified, verification_token
      ) VALUES (
        ${userId}, 
        ${userData.username}, 
        ${userData.email}, 
        ${password_hash}, 
        ${userData.role || "user"}, 
        ${userData.status || "active"}, 
        ${now}, 
        ${now}, 
        ${true}, 
        ${verification_token}
      )
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to create user - no result returned")
    }

    console.log("✅ [NEON] User created successfully:", result[0].id)
    return result[0] as User
  } catch (error) {
    console.error("❌ [NEON] Error creating user:", error)
    throw error
  }
}

// Add updateUser function
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    console.log("🔍 [NEON] Updating user:", id)

    // Build the SET clause dynamically
    const updateFields = Object.keys(updates).filter((key) => updates[key as keyof typeof updates] !== undefined)
    if (updateFields.length === 0) {
      return await findUserById(id)
    }

    const now = new Date()

    // Build the query dynamically
    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(", ")
    const values = [id, ...updateFields.map((field) => updates[field as keyof typeof updates]), now]

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = $${values.length}
      WHERE id = $1 
      RETURNING *
    `

    const result = await sql_client.unsafe(query, values)

    if (result && result.length > 0) {
      console.log("✅ [NEON] User updated successfully")
      return result[0] as User
    }

    console.log("❌ [NEON] User not found for update")
    return null
  } catch (error) {
    console.error("❌ [NEON] Error updating user:", error)
    throw error
  }
}

// Add getAllUsers function
export async function getAllUsers(): Promise<User[]> {
  try {
    console.log("🔍 [NEON] Getting all users")

    const result = await sql_client`
      SELECT * FROM users 
      ORDER BY created_at DESC
    `

    console.log("✅ [NEON] Retrieved users:", result.length)
    return result as User[]
  } catch (error) {
    console.error("❌ [NEON] Error getting all users:", error)
    return []
  }
}

export async function verifyUserPassword(user: User, password: string): Promise<boolean> {
  try {
    console.log("🔍 [NEON] Verifying password for user:", user.username)
    const isMatch = await bcrypt.compare(password, user.password_hash)
    console.log("✅ [NEON] Password verification result:", isMatch ? "matched" : "failed")
    return isMatch
  } catch (error) {
    console.error("❌ [NEON] Error verifying password:", error)
    throw error
  }
}

// Session functions
export async function createUserSession(userId: string, token: string, expiresAt: Date): Promise<Session> {
  try {
    console.log("🔍 [NEON] Creating session for user:", userId)

    const now = new Date()
    const sessionId = uuidv4()

    const result = await sql_client`
      INSERT INTO user_sessions (
        id, user_id, token, expires_at, created_at
      ) VALUES (
        ${sessionId}, 
        ${userId}, 
        ${token}, 
        ${expiresAt}, 
        ${now}
      )
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to create session - no result returned")
    }

    console.log("✅ [NEON] Session created successfully:", result[0].id)
    return result[0] as Session
  } catch (error) {
    console.error("❌ [NEON] Error creating session:", error)
    throw error
  }
}

// Add createSession function for compatibility
export async function createSession(userId: string, token: string): Promise<Session> {
  // Set expiration to 7 days from now
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  return createUserSession(userId, token, expiresAt)
}

export async function findSessionByToken(token: string): Promise<Session | null> {
  try {
    console.log("🔍 [NEON] Finding session by token")

    const result = await sql_client`
      SELECT * FROM user_sessions 
      WHERE token = ${token} AND expires_at > NOW() 
      LIMIT 1
    `

    if (result && result.length > 0) {
      console.log("✅ [NEON] Valid session found")
      return result[0] as Session
    }

    console.log("❌ [NEON] No valid session found for token")
    return null
  } catch (error) {
    console.error("❌ [NEON] Error finding session by token:", error)
    throw error
  }
}

export async function deleteUserSession(token: string): Promise<boolean> {
  try {
    console.log("🔍 [NEON] Deleting session with token")

    const result = await sql_client`
      DELETE FROM user_sessions WHERE token = ${token}
    `

    console.log("✅ [NEON] Session deleted successfully")
    return true
  } catch (error) {
    console.error("❌ [NEON] Error deleting session:", error)
    throw error
  }
}

// Recipe functions
export async function createRecipe(recipeData: {
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  prep_time: number
  cook_time: number
  servings: number
  difficulty: string
  category: string
  tags: string[]
  image_url?: string
  author_id: string
}): Promise<Recipe> {
  try {
    console.log("🔍 [NEON] Creating new recipe:", recipeData.title)

    // Get author name
    const author = await findUserById(recipeData.author_id)
    if (!author) {
      throw new Error("Author not found")
    }

    const now = new Date()
    const recipeId = uuidv4()

    // Convert arrays to JSON strings for storage
    const ingredientsJson = JSON.stringify(recipeData.ingredients)
    const instructionsJson = JSON.stringify(recipeData.instructions)
    const tagsJson = JSON.stringify(recipeData.tags)

    const result = await sql_client`
      INSERT INTO recipes (
        id, title, description, ingredients, instructions, 
        prep_time, cook_time, servings, difficulty, category, 
        tags, image_url, author_id, author_name, status, 
        created_at, updated_at
      ) VALUES (
        ${recipeId}, 
        ${recipeData.title}, 
        ${recipeData.description}, 
        ${ingredientsJson}, 
        ${instructionsJson}, 
        ${recipeData.prep_time}, 
        ${recipeData.cook_time}, 
        ${recipeData.servings}, 
        ${recipeData.difficulty}, 
        ${recipeData.category}, 
        ${tagsJson}, 
        ${recipeData.image_url || null}, 
        ${recipeData.author_id}, 
        ${author.username}, 
        ${"pending"}, 
        ${now}, 
        ${now}
      )
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error("Failed to create recipe - no result returned")
    }

    // Parse JSON strings back to arrays
    const recipe = result[0] as any
    recipe.ingredients = JSON.parse(recipe.ingredients)
    recipe.instructions = JSON.parse(recipe.instructions)
    recipe.tags = JSON.parse(recipe.tags)

    console.log("✅ [NEON] Recipe created successfully:", recipe.id)
    return recipe as Recipe
  } catch (error) {
    console.error("❌ [NEON] Error creating recipe:", error)
    throw error
  }
}

// Add moderateRecipe function
export async function moderateRecipe(recipeId: string, status: string, moderatorId: string): Promise<boolean> {
  try {
    console.log(`🔍 [NEON] Moderating recipe ${recipeId} to status ${status}`)

    const now = new Date()

    // Update recipe status
    await sql_client`
      UPDATE recipes 
      SET status = ${status}, updated_at = ${now} 
      WHERE id = ${recipeId}
    `

    // Log moderation action
    await sql_client`
      INSERT INTO moderation_log (
        id, moderator_id, action, details, created_at
      ) VALUES (
        ${uuidv4()},
        ${moderatorId},
        ${"recipe_moderation"},
        ${JSON.stringify({ recipeId, status })},
        ${now}
      )
    `

    console.log("✅ [NEON] Recipe moderated successfully")
    return true
  } catch (error) {
    console.error("❌ [NEON] Error moderating recipe:", error)
    return false
  }
}

export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    console.log("🔍 [NEON] Getting all approved recipes")

    const result = await sql_client`
      SELECT * FROM recipes 
      WHERE status = 'approved' 
      ORDER BY created_at DESC
    `

    // Parse JSON strings to arrays
    const recipes = result.map((recipe) => {
      const parsedRecipe = { ...recipe }
      parsedRecipe.ingredients = JSON.parse(recipe.ingredients)
      parsedRecipe.instructions = JSON.parse(recipe.instructions)
      parsedRecipe.tags = JSON.parse(recipe.tags)
      return parsedRecipe as Recipe
    })

    console.log("✅ [NEON] Retrieved recipes:", recipes.length)
    return recipes
  } catch (error) {
    console.error("❌ [NEON] Error getting recipes:", error)
    throw error
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    console.log("🔍 [NEON] Getting recipe by ID:", id)

    const result = await sql_client`
      SELECT * FROM recipes WHERE id = ${id} LIMIT 1
    `

    if (result && result.length > 0) {
      // Parse JSON strings to arrays
      const recipe = result[0]
      recipe.ingredients = JSON.parse(recipe.ingredients)
      recipe.instructions = JSON.parse(recipe.instructions)
      recipe.tags = JSON.parse(recipe.tags)

      console.log("✅ [NEON] Recipe found:", recipe.title)
      return recipe as Recipe
    }

    console.log("❌ [NEON] Recipe not found with ID:", id)
    return null
  } catch (error) {
    console.error("❌ [NEON] Error getting recipe by ID:", error)
    throw error
  }
}

export async function getPendingRecipes(): Promise<Recipe[]> {
  try {
    console.log("🔍 [NEON] Getting pending recipes")

    const result = await sql_client`
      SELECT * FROM recipes 
      WHERE status = 'pending' 
      ORDER BY created_at DESC
    `

    // Parse JSON strings to arrays
    const recipes = result.map((recipe) => {
      const parsedRecipe = { ...recipe }
      parsedRecipe.ingredients = JSON.parse(recipe.ingredients)
      parsedRecipe.instructions = JSON.parse(recipe.instructions)
      parsedRecipe.tags = JSON.parse(recipe.tags)
      return parsedRecipe as Recipe
    })

    console.log("✅ [NEON] Retrieved pending recipes:", recipes.length)
    return recipes
  } catch (error) {
    console.error("❌ [NEON] Error getting pending recipes:", error)
    throw error
  }
}

export async function updateRecipeStatus(id: string, status: string): Promise<Recipe | null> {
  try {
    console.log(`🔍 [NEON] Updating recipe ${id} status to ${status}`)

    const now = new Date()

    const result = await sql_client`
      UPDATE recipes 
      SET status = ${status}, updated_at = ${now} 
      WHERE id = ${id} 
      RETURNING *
    `

    if (result && result.length > 0) {
      // Parse JSON strings to arrays
      const recipe = result[0]
      recipe.ingredients = JSON.parse(recipe.ingredients)
      recipe.instructions = JSON.parse(recipe.instructions)
      recipe.tags = JSON.parse(recipe.tags)

      console.log("✅ [NEON] Recipe status updated successfully")
      return recipe as Recipe
    }

    console.log("❌ [NEON] Recipe not found for status update")
    return null
  } catch (error) {
    console.error("❌ [NEON] Error updating recipe status:", error)
    throw error
  }
}

// Database initialization and testing
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log("🔍 [NEON] Testing database connection")

    const result = await sql_client`SELECT 1 as test`

    console.log("✅ [NEON] Database connection successful")
    return true
  } catch (error) {
    console.error("❌ [NEON] Database connection failed:", error)
    return false
  }
}

export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log("🔍 [NEON] Initializing database")

    // Check if users table exists
    const userTableExists = await sql_client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `

    if (!userTableExists[0].exists) {
      console.log("🔍 [NEON] Creating users table")

      await sql_client`
        CREATE TABLE users (
          id UUID PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          is_verified BOOLEAN NOT NULL DEFAULT FALSE,
          verification_token VARCHAR(255),
          reset_token VARCHAR(255),
          reset_token_expires TIMESTAMP,
          avatar_url TEXT,
          bio TEXT,
          location VARCHAR(255),
          website VARCHAR(255),
          warning_count INTEGER DEFAULT 0,
          suspension_reason TEXT,
          suspension_expires_at TIMESTAMP,
          last_login_at TIMESTAMP,
          is_profile_verified BOOLEAN DEFAULT FALSE
        )
      `
    }

    // Check if sessions table exists
    const sessionTableExists = await sql_client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_sessions'
      )
    `

    if (!sessionTableExists[0].exists) {
      console.log("🔍 [NEON] Creating user_sessions table")

      await sql_client`
        CREATE TABLE user_sessions (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL
        )
      `
    }

    // Check if recipes table exists
    const recipeTableExists = await sql_client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recipes'
      )
    `

    if (!recipeTableExists[0].exists) {
      console.log("🔍 [NEON] Creating recipes table")

      await sql_client`
        CREATE TABLE recipes (
          id UUID PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          ingredients JSONB NOT NULL,
          instructions JSONB NOT NULL,
          prep_time INTEGER NOT NULL,
          cook_time INTEGER NOT NULL,
          servings INTEGER NOT NULL,
          difficulty VARCHAR(50) NOT NULL,
          category VARCHAR(100) NOT NULL,
          tags JSONB,
          image_url VARCHAR(255),
          author_id UUID NOT NULL REFERENCES users(id),
          author_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL,
          rating FLOAT,
          rating_count INTEGER DEFAULT 0
        )
      `
    }

    // Check if moderation_log table exists
    const moderationLogTableExists = await sql_client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'moderation_log'
      )
    `

    if (!moderationLogTableExists[0].exists) {
      console.log("🔍 [NEON] Creating moderation_log table")

      await sql_client`
        CREATE TABLE moderation_log (
          id UUID PRIMARY KEY,
          moderator_id UUID NOT NULL REFERENCES users(id),
          action VARCHAR(100) NOT NULL,
          details JSONB,
          created_at TIMESTAMP NOT NULL
        )
      `
    }

    console.log("✅ [NEON] Database initialization complete")
    return true
  } catch (error) {
    console.error("❌ [NEON] Database initialization failed:", error)
    return false
  }
}

// Add getStackAuthConfig function
export function getStackAuthConfig() {
  return {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    projectId: process.env.STACK_PROJECT_ID || "",
    clientKey: process.env.STACK_CLIENT_KEY || "",
    serverKey: process.env.STACK_SERVER_KEY || "",
  }
}

// Export the database client for direct queries
export { sql_client, db }
