import { neon, neonConfig } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

// Configure neon
neonConfig.fetchConnectionCache = true

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Initialize database connection
const sql_client = neon(process.env.DATABASE_URL)
export const sql = sql_client

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

// Database initialization
export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log("🔍 [NEON] Initializing database")

    // Create users table
    await sql_client`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_verified BOOLEAN NOT NULL DEFAULT TRUE,
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

    // Create user_sessions table
    await sql_client`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    // Create recipes table
    await sql_client`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients JSONB NOT NULL,
        instructions JSONB NOT NULL,
        prep_time INTEGER NOT NULL,
        cook_time INTEGER NOT NULL,
        servings INTEGER NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        category VARCHAR(100) NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        image_url VARCHAR(255),
        author_id UUID NOT NULL REFERENCES users(id),
        author_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        rating FLOAT,
        rating_count INTEGER DEFAULT 0
      )
    `

    // Create moderation_log table
    await sql_client`
      CREATE TABLE IF NOT EXISTS moderation_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        moderator_id UUID NOT NULL REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        details JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `

    console.log("✅ [NEON] Database initialization complete")
    return true
  } catch (error) {
    console.error("❌ [NEON] Database initialization failed:", error)
    throw error
  }
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

    const result = await sql_client`
      INSERT INTO users (
        username, email, password_hash, role, status, is_verified
      ) VALUES (
        ${userData.username}, 
        ${userData.email}, 
        ${password_hash}, 
        ${userData.role || "user"}, 
        ${userData.status || "active"}, 
        ${true}
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
export async function createSession(userId: string, token: string): Promise<Session> {
  try {
    console.log("🔍 [NEON] Creating session for user:", userId)

    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const result = await sql_client`
      INSERT INTO user_sessions (
        user_id, token, expires_at
      ) VALUES (
        ${userId}, 
        ${token}, 
        ${expiresAt}
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

    await sql_client`
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

    const result = await sql_client`
      INSERT INTO recipes (
        title, description, ingredients, instructions, 
        prep_time, cook_time, servings, difficulty, category, 
        tags, image_url, author_id, author_name, status
      ) VALUES (
        ${recipeData.title}, 
        ${recipeData.description}, 
        ${JSON.stringify(recipeData.ingredients)}, 
        ${JSON.stringify(recipeData.instructions)}, 
        ${recipeData.prep_time}, 
        ${recipeData.cook_time}, 
        ${recipeData.servings}, 
        ${recipeData.difficulty}, 
        ${recipeData.category}, 
        ${JSON.stringify(recipeData.tags)}, 
        ${recipeData.image_url || null}, 
        ${recipeData.author_id}, 
        ${author.username}, 
        ${"pending"}
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
    return []
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
    return []
  }
}

// Additional required exports for compatibility
export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    console.log("🔍 [NEON] Updating user:", id)

    const updateFields = Object.keys(updates).filter((key) => updates[key as keyof typeof updates] !== undefined)
    if (updateFields.length === 0) {
      return await findUserById(id)
    }

    const setClause = updateFields.map((field, index) => `${field} = $${index + 2}`).join(", ")
    const values = [id, ...updateFields.map((field) => updates[field as keyof typeof updates])]

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 
      RETURNING *
    `

    const result = await sql_client.unsafe(query, values)

    if (result && result.length > 0) {
      console.log("✅ [NEON] User updated successfully")
      return result[0] as User
    }

    return null
  } catch (error) {
    console.error("❌ [NEON] Error updating user:", error)
    throw error
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await sql_client`SELECT * FROM users ORDER BY created_at DESC`
    return result as User[]
  } catch (error) {
    console.error("❌ [NEON] Error getting all users:", error)
    return []
  }
}

export async function moderateRecipe(recipeId: string, status: string, moderatorId: string): Promise<boolean> {
  try {
    await sql_client`UPDATE recipes SET status = ${status}, updated_at = NOW() WHERE id = ${recipeId}`

    await sql_client`
      INSERT INTO moderation_log (moderator_id, action, details)
      VALUES (${moderatorId}, ${"recipe_moderation"}, ${JSON.stringify({ recipeId, status })})
    `

    return true
  } catch (error) {
    console.error("❌ [NEON] Error moderating recipe:", error)
    return false
  }
}

export function getStackAuthConfig() {
  return {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    projectId: process.env.STACK_PROJECT_ID || "",
    clientKey: process.env.STACK_CLIENT_KEY || "",
    serverKey: process.env.STACK_SERVER_KEY || "",
  }
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await sql_client`SELECT 1 as test`
    return true
  } catch (error) {
    console.error("❌ [NEON] Database connection failed:", error)
    return false
  }
}
