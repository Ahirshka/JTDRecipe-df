import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

export interface User {
  id: string
  username: string
  email: string
  password_hash: string
  role: string
  status: string
  is_verified: boolean
  verification_token?: string
  reset_token?: string
  reset_token_expires?: string
  created_at: string
  updated_at: string
  last_login_at?: string
  profile_image?: string
  bio?: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: string
  instructions: string
  prep_time: number
  cook_time: number
  servings: number
  difficulty: string
  cuisine: string
  tags: string
  image_url?: string
  user_id: string
  status: string
  created_at: string
  updated_at: string
  rating?: number
  rating_count?: number
  author_username?: string
}

export interface Session {
  id: string
  user_id: string
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
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        verification_token VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        profile_image TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `

    // Create user_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipes table
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        prep_time INTEGER DEFAULT 0,
        cook_time INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 1,
        difficulty VARCHAR(20) NOT NULL,
        cuisine VARCHAR(100) NOT NULL,
        tags TEXT,
        image_url TEXT,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        rating DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create moderation_log table
    await sql`
      CREATE TABLE IF NOT EXISTS moderation_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
        moderator_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create email_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS email_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create owner account if it doesn't exist
    const ownerEmail = "owner@jtdrecipe.com"
    const existingOwner = await findUserByEmail(ownerEmail)

    if (!existingOwner) {
      const passwordHash = await bcrypt.hash("Morton2121", 12)
      await sql`
        INSERT INTO users (username, email, password_hash, role, status, is_verified)
        VALUES ('Site Owner', ${ownerEmail}, ${passwordHash}, 'owner', 'active', true)
      `
      console.log("✅ Owner account created")
    } else {
      console.log("✅ Owner account already exists")
    }

    console.log("✅ Database initialized successfully")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}

// User functions
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error finding user by email:", error)
    return null
  }
}

export async function findUserById(id: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error finding user by ID:", error)
    return null
  }
}

export async function findUserByUsername(username: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE username = ${username} LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error finding user by username:", error)
    return null
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password_hash: string
  verification_token?: string
  role?: string
}): Promise<User | null> {
  try {
    const result = await sql`
      INSERT INTO users (username, email, password_hash, verification_token, role, status, is_verified)
      VALUES (
        ${userData.username}, 
        ${userData.email}, 
        ${userData.password_hash}, 
        ${userData.verification_token || null}, 
        ${userData.role || "user"}, 
        'active', 
        false
      )
      RETURNING *
    `
    return result[0] || null
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

export async function updateUserById(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = [id, ...Object.values(updates)]

    const result = await sql.unsafe(
      `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
      values,
    )

    return result[0] || null
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

export async function verifyUser(email: string): Promise<boolean> {
  try {
    await sql`
      UPDATE users 
      SET is_verified = true, verification_token = NULL, updated_at = NOW()
      WHERE email = ${email}
    `
    return true
  } catch (error) {
    console.error("Error verifying user:", error)
    return false
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await sql`
      SELECT id, username, email, role, status, is_verified, created_at, last_login_at
      FROM users
      ORDER BY created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}

export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  try {
    await sql`
      UPDATE users 
      SET role = ${role}, updated_at = NOW()
      WHERE id = ${userId}
    `
    return true
  } catch (error) {
    console.error("Error updating user role:", error)
    return false
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // Delete user's recipes first
    await sql`DELETE FROM recipes WHERE user_id = ${userId}`

    // Delete user's sessions
    await sql`DELETE FROM user_sessions WHERE user_id = ${userId}`

    // Delete the user
    await sql`DELETE FROM users WHERE id = ${userId}`

    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

// Session functions
export async function createSession(userId: string, token: string, expiresAt: Date): Promise<Session | null> {
  try {
    const result = await sql`
      INSERT INTO user_sessions (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()})
      RETURNING *
    `
    return result[0] || null
  } catch (error) {
    console.error("Error creating session:", error)
    return null
  }
}

export async function deleteSession(token: string): Promise<boolean> {
  try {
    await sql`
      DELETE FROM user_sessions WHERE token = ${token}
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
      SELECT * FROM user_sessions 
      WHERE token = ${token} AND expires_at > NOW()
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error finding session:", error)
    return null
  }
}

// Recipe functions
export async function createRecipe(recipeData: {
  title: string
  description: string
  ingredients: string
  instructions: string
  prep_time: number
  cook_time: number
  servings: number
  difficulty: string
  cuisine: string
  tags: string
  user_id: string
  image_url?: string
}): Promise<Recipe | null> {
  try {
    const result = await sql`
      INSERT INTO recipes (
        title, description, ingredients, instructions, prep_time, cook_time,
        servings, difficulty, cuisine, tags, user_id, image_url, status
      )
      VALUES (
        ${recipeData.title}, ${recipeData.description}, ${recipeData.ingredients},
        ${recipeData.instructions}, ${recipeData.prep_time}, ${recipeData.cook_time},
        ${recipeData.servings}, ${recipeData.difficulty}, ${recipeData.cuisine},
        ${recipeData.tags}, ${recipeData.user_id}, ${recipeData.image_url || null}, 'pending'
      )
      RETURNING *
    `
    return result[0] || null
  } catch (error) {
    console.error("Error creating recipe:", error)
    return null
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    const result = await sql`
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ${id}
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error getting recipe by ID:", error)
    return null
  }
}

export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const result = await sql`
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'approved'
      ORDER BY r.created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error getting all recipes:", error)
    return []
  }
}

export async function getPendingRecipes(): Promise<Recipe[]> {
  try {
    const result = await sql`
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error getting pending recipes:", error)
    return []
  }
}

export async function moderateRecipe(
  id: string,
  status: "approved" | "rejected",
  moderatorId: string,
  notes?: string,
): Promise<boolean> {
  try {
    await sql`
      UPDATE recipes 
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `

    // Log the moderation action
    await sql`
      INSERT INTO moderation_log (recipe_id, moderator_id, action, notes, created_at)
      VALUES (${id}, ${moderatorId}, ${status}, ${notes || null}, NOW())
    `

    return true
  } catch (error) {
    console.error("Error moderating recipe:", error)
    return false
  }
}

export async function searchRecipes(
  query: string,
  filters?: {
    cuisine?: string
    difficulty?: string
    maxPrepTime?: number
  },
): Promise<Recipe[]> {
  try {
    let whereClause = "WHERE r.status = 'approved'"
    const params: any[] = []

    if (query) {
      whereClause += ` AND (r.title ILIKE $${params.length + 1} OR r.description ILIKE $${params.length + 1} OR r.tags ILIKE $${params.length + 1})`
      params.push(`%${query}%`)
    }

    if (filters?.cuisine) {
      whereClause += ` AND r.cuisine = $${params.length + 1}`
      params.push(filters.cuisine)
    }

    if (filters?.difficulty) {
      whereClause += ` AND r.difficulty = $${params.length + 1}`
      params.push(filters.difficulty)
    }

    if (filters?.maxPrepTime) {
      whereClause += ` AND r.prep_time <= $${params.length + 1}`
      params.push(filters.maxPrepTime)
    }

    const query_sql = `
      SELECT r.*, u.username as author_username
      FROM recipes r
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT 50
    `

    const result = await sql.unsafe(query_sql, params)
    return result
  } catch (error) {
    console.error("Error searching recipes:", error)
    return []
  }
}

// Email token functions
export async function createEmailToken(data: {
  user_id: string
  token: string
  token_type: string
  expires_at: Date
}): Promise<void> {
  try {
    await sql`
      INSERT INTO email_tokens (user_id, token, token_type, expires_at)
      VALUES (${data.user_id}, ${data.token}, ${data.token_type}, ${data.expires_at.toISOString()})
    `
  } catch (error) {
    console.error("Error creating email token:", error)
    throw error
  }
}

export async function findEmailToken(token: string, tokenType: string): Promise<any> {
  try {
    const result = await sql`
      SELECT * FROM email_tokens 
      WHERE token = ${token} AND token_type = ${tokenType} AND used = false AND expires_at > NOW()
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("Error finding email token:", error)
    return null
  }
}

export async function markEmailTokenAsUsed(token: string): Promise<void> {
  try {
    await sql`
      UPDATE email_tokens SET used = true WHERE token = ${token}
    `
  } catch (error) {
    console.error("Error marking email token as used:", error)
    throw error
  }
}

// Stack Auth configuration (placeholder for compatibility)
export function getStackAuthConfig() {
  return {
    projectId: process.env.STACK_PROJECT_ID || "default",
    clientUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    serverUrl: process.env.STACK_API_URL || "http://localhost:3000/api",
  }
}

// Admin stats
export async function getAdminStats() {
  try {
    const [userCount, recipeCount, pendingCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM recipes WHERE status = 'approved'`,
      sql`SELECT COUNT(*) as count FROM recipes WHERE status = 'pending'`,
    ])

    return {
      users: Number.parseInt(userCount[0].count),
      recipes: Number.parseInt(recipeCount[0].count),
      pending: Number.parseInt(pendingCount[0].count),
    }
  } catch (error) {
    console.error("Error getting admin stats:", error)
    return { users: 0, recipes: 0, pending: 0 }
  }
}
