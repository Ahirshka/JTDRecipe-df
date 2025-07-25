import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

export interface User {
  id: number
  username: string
  email: string
  password_hash?: string
  role: string
  status: string
  is_verified: boolean
  is_profile_verified: boolean
  avatar_url?: string
  bio?: string
  location?: string
  website?: string
  created_at: string
  updated_at: string
  last_login_at?: string
  warning_count?: number
  suspension_reason?: string
  suspension_expires_at?: string
}

export interface Recipe {
  id: number
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
  author_id: number
  author_name: string
  status: string
  created_at: string
  updated_at: string
  rating?: number
  rating_count?: number
}

export interface Session {
  id: string
  user_id: number
  token: string
  expires_at: string
  created_at: string
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("🔄 Initializing database tables...")

    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        is_profile_verified BOOLEAN DEFAULT false,
        avatar_url TEXT,
        bio TEXT,
        location VARCHAR(255),
        website VARCHAR(255),
        warning_count INTEGER DEFAULT 0,
        suspension_reason TEXT,
        suspension_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
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
        tags JSONB DEFAULT '[]',
        image_url TEXT,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create email_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS email_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token TEXT UNIQUE NOT NULL,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create moderation_log table
    await sql`
      CREATE TABLE IF NOT EXISTS moderation_log (
        id SERIAL PRIMARY KEY,
        moderator_id INTEGER REFERENCES users(id),
        target_user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        reason TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log("✅ Database tables initialized successfully")
  } catch (error) {
    console.error("❌ Error initializing database:", error)
    throw error
  }
}

// User management functions
export async function findUserById(id: number): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `
    return result.length > 0 ? (result[0] as User) : null
  } catch (error) {
    console.error("Error finding user by ID:", error)
    return null
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `
    return result.length > 0 ? (result[0] as User) : null
  } catch (error) {
    console.error("Error finding user by email:", error)
    return null
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password_hash: string
  role?: string
  is_verified?: boolean
  is_profile_verified?: boolean
}): Promise<User> {
  try {
    const result = await sql`
      INSERT INTO users (username, email, password_hash, role, is_verified, is_profile_verified)
      VALUES (${userData.username}, ${userData.email}, ${userData.password_hash}, 
              ${userData.role || "user"}, ${userData.is_verified || false}, 
              ${userData.is_profile_verified || false})
      RETURNING *
    `
    return result[0] as User
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  try {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = [id, ...Object.values(updates)]

    const result = await sql`
      UPDATE users 
      SET ${sql.unsafe(setClause)}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `.apply(null, values)

    return result.length > 0 ? (result[0] as User) : null
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function updateUserById(id: number, updates: Partial<User>): Promise<User | null> {
  return updateUser(id, updates)
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await sql`
      SELECT * FROM users ORDER BY created_at DESC
    `
    return result as User[]
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

// Session management
export async function createSession(userId: number, token: string): Promise<Session> {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const result = await sql`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
      RETURNING *
    `
    return result[0] as Session
  } catch (error) {
    console.error("Error creating session:", error)
    throw error
  }
}

export async function deleteSession(token: string): Promise<boolean> {
  try {
    await sql`
      DELETE FROM sessions WHERE token = ${token}
    `
    return true
  } catch (error) {
    console.error("Error deleting session:", error)
    return false
  }
}

export async function findSessionByToken(token: string): Promise<Session | null> {
  try {
    const result = await sql`
      SELECT * FROM sessions WHERE token = ${token} AND expires_at > NOW()
    `
    return result.length > 0 ? (result[0] as Session) : null
  } catch (error) {
    console.error("Error finding session:", error)
    return null
  }
}

// Recipe management functions
export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const result = await sql`
      SELECT 
        r.*,
        u.username as author_name
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
    `
    return result as Recipe[]
  } catch (error) {
    console.error("Error getting all recipes:", error)
    return []
  }
}

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
  author_id: number
}): Promise<Recipe> {
  try {
    const result = await sql`
      INSERT INTO recipes (
        title, description, ingredients, instructions, prep_time, cook_time,
        servings, difficulty, category, tags, image_url, author_id
      )
      VALUES (
        ${recipeData.title}, ${recipeData.description}, ${JSON.stringify(recipeData.ingredients)},
        ${JSON.stringify(recipeData.instructions)}, ${recipeData.prep_time}, ${recipeData.cook_time},
        ${recipeData.servings}, ${recipeData.difficulty}, ${recipeData.category},
        ${JSON.stringify(recipeData.tags)}, ${recipeData.image_url}, ${recipeData.author_id}
      )
      RETURNING *
    `
    return result[0] as Recipe
  } catch (error) {
    console.error("Error creating recipe:", error)
    throw error
  }
}

export async function getPendingRecipes(): Promise<Recipe[]> {
  try {
    const result = await sql`
      SELECT 
        r.*,
        u.username as author_name
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
    `
    return result as Recipe[]
  } catch (error) {
    console.error("Error getting pending recipes:", error)
    return []
  }
}

export async function moderateRecipe(recipeId: number, status: string, moderatorId: number): Promise<boolean> {
  try {
    await sql`
      UPDATE recipes 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${recipeId}
    `

    // Log moderation action
    await sql`
      INSERT INTO moderation_log (moderator_id, action, details)
      VALUES (${moderatorId}, 'recipe_moderation', ${JSON.stringify({ recipeId, status })})
    `

    return true
  } catch (error) {
    console.error("Error moderating recipe:", error)
    return false
  }
}

// Stack Auth configuration
export function getStackAuthConfig() {
  return {
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    projectId: process.env.STACK_PROJECT_ID || "",
    clientKey: process.env.STACK_CLIENT_KEY || "",
    serverKey: process.env.STACK_SERVER_KEY || "",
  }
}

// Search functionality
export async function searchRecipes(
  query: string,
  filters?: {
    category?: string
    difficulty?: string
    maxPrepTime?: number
  },
): Promise<Recipe[]> {
  try {
    let whereClause = "r.status = 'approved'"
    const params: any[] = []

    if (query) {
      whereClause += ` AND (r.title ILIKE $${params.length + 1} OR r.description ILIKE $${params.length + 1})`
      params.push(`%${query}%`)
    }

    if (filters?.category) {
      whereClause += ` AND r.category = $${params.length + 1}`
      params.push(filters.category)
    }

    if (filters?.difficulty) {
      whereClause += ` AND r.difficulty = $${params.length + 1}`
      params.push(filters.difficulty)
    }

    if (filters?.maxPrepTime) {
      whereClause += ` AND r.prep_time <= $${params.length + 1}`
      params.push(filters.maxPrepTime)
    }

    const result = await sql`
      SELECT 
        r.*,
        u.username as author_name
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE ${sql.unsafe(whereClause)}
      ORDER BY r.created_at DESC
    `.apply(null, params)

    return result as Recipe[]
  } catch (error) {
    console.error("Error searching recipes:", error)
    return []
  }
}

// Email token management
export async function createEmailToken(userId: number, tokenType: string): Promise<string> {
  try {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hours

    await sql`
      INSERT INTO email_tokens (user_id, token, token_type, expires_at)
      VALUES (${userId}, ${token}, ${tokenType}, ${expiresAt.toISOString()})
    `

    return token
  } catch (error) {
    console.error("Error creating email token:", error)
    throw error
  }
}

export async function verifyEmailToken(token: string, tokenType: string): Promise<number | null> {
  try {
    const result = await sql`
      SELECT user_id FROM email_tokens
      WHERE token = ${token} AND token_type = ${tokenType} AND expires_at > NOW()
    `

    if (result.length === 0) {
      return null
    }

    // Delete the used token
    await sql`
      DELETE FROM email_tokens WHERE token = ${token}
    `

    return result[0].user_id
  } catch (error) {
    console.error("Error verifying email token:", error)
    return null
  }
}
