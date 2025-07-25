import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// REQUIRED EXPORT - sql client
export const sql = neon(process.env.DATABASE_URL)

export interface User {
  id: number
  username: string
  email: string
  password_hash: string
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
  ingredients?: string[]
  instructions?: string[]
  image_url?: string
  rating?: number
  review_count?: number
  view_count?: number
  is_published: boolean
  moderation_status: "pending" | "approved" | "rejected"
  moderation_notes?: string
  moderated_by?: number
  moderated_at?: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  recipe_id: string
  user_id: number
  username: string
  content: string
  status: string
  is_flagged: boolean
  flagged_reason?: string
  flagged_by?: number
  flagged_at?: string
  created_at: string
}

export interface Rating {
  id: number
  recipe_id: string
  user_id: number
  rating: number
  created_at: string
}

export interface Session {
  id: number
  user_id: number
  token: string
  expires_at: string
  created_at: string
}

// Mock data for fallback
const mockUsers = new Map<number, User>()
const mockRecipes = new Map<string, Recipe>()
const mockSessions = new Map<number, Session>()

// Initialize mock data
const initializeMockData = async () => {
  if (mockUsers.size > 0) return

  const ownerPasswordHash = await bcrypt.hash("Morton2121", 12)
  const ownerUser: User = {
    id: 1,
    username: "Aaron Hirshka",
    email: "aaronhirshka@gmail.com",
    password_hash: ownerPasswordHash,
    role: "owner",
    status: "active",
    is_verified: true,
    is_profile_verified: true,
    bio: "",
    location: "",
    website: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  }

  mockUsers.set(ownerUser.id, ownerUser)
}

// Initialize mock data
initializeMockData()

// User functions
export async function findUserById(id: number): Promise<User | null> {
  try {
    console.log(`🔍 Finding user by ID: ${id}`)
    const result = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`

    if (result.length === 0) {
      console.log(`❌ User not found with ID: ${id}`)
      return mockUsers.get(id) || null
    }

    console.log(`✅ Found user: ${result[0].username}`)
    return result[0] as User
  } catch (error) {
    console.error(`❌ Error finding user by ID ${id}:`, error)
    return mockUsers.get(id) || null
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    console.log(`🔍 Finding user by email: ${email}`)
    const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`

    if (result.length === 0) {
      console.log(`❌ User not found with email: ${email}`)
      // Check mock data
      for (const user of mockUsers.values()) {
        if (user.email === email) {
          return user
        }
      }
      return null
    }

    console.log(`✅ Found user: ${result[0].username}`)
    return result[0] as User
  } catch (error) {
    console.error(`❌ Error finding user by email ${email}:`, error)
    // Check mock data as fallback
    for (const user of mockUsers.values()) {
      if (user.email === email) {
        return user
      }
    }
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
    console.log(`🔄 Creating new user: ${userData.username} (${userData.email})`)

    const result = await sql`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        role, 
        status, 
        is_verified, 
        is_profile_verified, 
        created_at, 
        updated_at
      )
      VALUES (
        ${userData.username},
        ${userData.email},
        ${userData.password_hash},
        ${userData.role || "user"},
        ${"active"},
        ${userData.is_verified || false},
        ${userData.is_profile_verified || false},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    console.log(`✅ User created: ${result[0].id}`)
    return result[0] as User
  } catch (error) {
    console.error(`❌ Error creating user:`, error)
    throw new Error("Failed to create user")
  }
}

// REQUIRED EXPORT - Update user
export async function updateUser(userId: number, updates: Partial<User>): Promise<User | null> {
  try {
    console.log(`🔄 Updating user ${userId} with:`, updates)

    // Build the SET clause dynamically
    const setClauses = []
    const values = []

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== "id") {
        setClauses.push(`${key} = $${setClauses.length + 2}`)
        values.push(value)
      }
    }

    if (setClauses.length === 0) {
      console.log(`⚠️ No valid updates provided for user ${userId}`)
      return await findUserById(userId)
    }

    // Always update the updated_at timestamp
    setClauses.push(`updated_at = NOW()`)

    const query = `
      UPDATE users 
      SET ${setClauses.join(", ")} 
      WHERE id = $1
      RETURNING *
    `

    const result = await sql.unsafe(query, [userId, ...values])

    if (result.length === 0) {
      console.log(`❌ User not found for update: ${userId}`)
      return null
    }

    console.log(`✅ User updated: ${userId}`)
    return result[0] as User
  } catch (error) {
    console.error(`❌ Error updating user ${userId}:`, error)
    // Update mock data as fallback
    const user = mockUsers.get(userId)
    if (user) {
      const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() }
      mockUsers.set(userId, updatedUser)
      return updatedUser
    }
    return null
  }
}

export async function updateUserById(userId: number, updates: Partial<User>): Promise<User | null> {
  return updateUser(userId, updates)
}

export async function getAllUsers(): Promise<User[]> {
  try {
    console.log(`🔍 Getting all users`)

    const result = await sql`
      SELECT * FROM users
      ORDER BY created_at DESC
    `

    console.log(`✅ Found ${result.length} users`)
    return result as User[]
  } catch (error) {
    console.error(`❌ Error getting all users:`, error)
    return Array.from(mockUsers.values())
  }
}

export async function updateUserLoginTime(userId: number): Promise<void> {
  try {
    await sql`
      UPDATE users 
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = ${userId}
    `
    console.log(`✅ Updated login time for user ${userId}`)
  } catch (error) {
    console.error(`❌ Error updating user login time for ${userId}:`, error)
  }
}

// Session management
export async function createSession(userId: number, token: string): Promise<Session> {
  try {
    console.log(`🔄 Creating session for user ${userId}`)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const result = await sql`
      INSERT INTO user_sessions (
        user_id,
        token,
        expires_at,
        created_at
      )
      VALUES (
        ${userId},
        ${token},
        ${expiresAt.toISOString()},
        NOW()
      )
      RETURNING *
    `

    console.log(`✅ Session created for user ${userId}`)
    return result[0] as Session
  } catch (error) {
    console.error(`❌ Error creating session for user ${userId}:`, error)
    // Create mock session as fallback
    const session: Session = {
      id: Date.now(),
      user_id: userId,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    }
    mockSessions.set(session.id, session)
    return session
  }
}

export async function findSessionByToken(token: string): Promise<Session | null> {
  try {
    const result = await sql`
      SELECT * FROM user_sessions 
      WHERE token = ${token} AND expires_at > NOW() 
      LIMIT 1
    `

    if (result.length === 0) {
      // Check mock sessions
      for (const session of mockSessions.values()) {
        if (session.token === token && new Date(session.expires_at) > new Date()) {
          return session
        }
      }
      return null
    }

    return result[0] as Session
  } catch (error) {
    console.error(`❌ Error finding session:`, error)
    // Check mock sessions as fallback
    for (const session of mockSessions.values()) {
      if (session.token === token && new Date(session.expires_at) > new Date()) {
        return session
      }
    }
    return null
  }
}

export async function deleteSession(token: string): Promise<void> {
  try {
    console.log(`🔄 Deleting session`)

    await sql`
      DELETE FROM user_sessions
      WHERE token = ${token}
    `

    console.log(`✅ Session deleted`)
  } catch (error) {
    console.error(`❌ Error deleting session:`, error)
    // Delete from mock sessions as fallback
    for (const [id, session] of mockSessions.entries()) {
      if (session.token === token) {
        mockSessions.delete(id)
        break
      }
    }
  }
}

// Recipe functions
export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    console.log(`🔍 Getting all approved recipes`)

    const result = await sql`
      SELECT 
        r.*,
        u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'approved' AND r.is_published = true
      ORDER BY r.created_at DESC
    `

    console.log(`✅ Found ${result.length} approved recipes`)
    return result as Recipe[]
  } catch (error) {
    console.error(`❌ Error getting all recipes:`, error)
    return Array.from(mockRecipes.values()).filter((r) => r.moderation_status === "approved")
  }
}

export async function getPendingRecipes(): Promise<Recipe[]> {
  try {
    console.log(`🔍 Getting pending recipes`)

    const result = await sql`
      SELECT 
        r.*,
        u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.moderation_status = 'pending'
      ORDER BY r.created_at DESC
    `

    console.log(`✅ Found ${result.length} pending recipes`)
    return result as Recipe[]
  } catch (error) {
    console.error(`❌ Error getting pending recipes:`, error)
    return Array.from(mockRecipes.values()).filter((r) => r.moderation_status === "pending")
  }
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  try {
    console.log(`🔍 Finding recipe by ID: ${id}`)

    const result = await sql`
      SELECT 
        r.*,
        u.username as author_username
      FROM recipes r
      JOIN users u ON r.author_id = u.id
      WHERE r.id = ${id}
      LIMIT 1
    `

    if (result.length === 0) {
      console.log(`❌ Recipe not found with ID: ${id}`)
      return mockRecipes.get(id) || null
    }

    console.log(`✅ Found recipe: ${result[0].title}`)
    return result[0] as Recipe
  } catch (error) {
    console.error(`❌ Error finding recipe by ID ${id}:`, error)
    return mockRecipes.get(id) || null
  }
}

export async function createRecipe(recipeData: {
  title: string
  description?: string
  author_id: number
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  ingredients: string[]
  instructions: string[]
  image_url?: string | null
}): Promise<Recipe> {
  try {
    console.log(`🔄 Creating new recipe: ${recipeData.title}`)

    // Generate a unique ID
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Insert the main recipe record
    const result = await sql`
      INSERT INTO recipes (
        id,
        title,
        description,
        author_id,
        category,
        difficulty,
        prep_time_minutes,
        cook_time_minutes,
        servings,
        image_url,
        moderation_status,
        is_published,
        created_at,
        updated_at
      )
      VALUES (
        ${recipeId},
        ${recipeData.title},
        ${recipeData.description || ""},
        ${recipeData.author_id},
        ${recipeData.category},
        ${recipeData.difficulty},
        ${recipeData.prep_time_minutes},
        ${recipeData.cook_time_minutes},
        ${recipeData.servings},
        ${recipeData.image_url || null},
        ${"pending"},
        ${false},
        NOW(),
        NOW()
      )
      RETURNING *
    `

    const recipe = result[0] as Recipe

    console.log(`✅ Recipe created: ${recipeId}`)
    return {
      ...recipe,
      author_username: recipeData.author_username,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
    }
  } catch (error) {
    console.error(`❌ Error creating recipe:`, error)
    throw new Error(`Failed to create recipe: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function moderateRecipe(
  recipeId: string,
  status: "approved" | "rejected",
  moderatorId: number,
): Promise<Recipe | null> {
  try {
    console.log(`🔄 Moderating recipe ${recipeId} as ${status}`)

    const result = await sql`
      UPDATE recipes
      SET 
        moderation_status = ${status},
        is_published = ${status === "approved"},
        moderated_by = ${moderatorId},
        moderated_at = NOW(),
        updated_at = NOW()
      WHERE id = ${recipeId}
      RETURNING *
    `

    if (result.length === 0) {
      console.log(`❌ Recipe not found for moderation: ${recipeId}`)
      return null
    }

    console.log(`✅ Recipe moderated: ${recipeId} (${status})`)
    return result[0] as Recipe
  } catch (error) {
    console.error(`❌ Error moderating recipe ${recipeId}:`, error)
    return null
  }
}

export async function getAdminStats() {
  try {
    const [userCount, recipeCount, pendingCount] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM recipes WHERE is_published = true`,
      sql`SELECT COUNT(*) as count FROM recipes WHERE moderation_status = 'pending'`,
    ])

    return {
      users: Number.parseInt(userCount[0].count),
      recipes: Number.parseInt(recipeCount[0].count),
      pending: Number.parseInt(pendingCount[0].count),
    }
  } catch (error) {
    console.error("Error getting admin stats:", error)
    return { users: mockUsers.size, recipes: 0, pending: 0 }
  }
}

export async function initializeOwnerAccount() {
  try {
    const ownerEmail = "aaronhirshka@gmail.com"
    const existingOwner = await findUserByEmail(ownerEmail)

    if (!existingOwner) {
      const passwordHash = await bcrypt.hash("Morton2121", 12)

      await createUser({
        username: "Aaron Hirshka",
        email: ownerEmail,
        password_hash: passwordHash,
        role: "owner",
        is_verified: true,
        is_profile_verified: true,
      })

      console.log("✅ Owner account created successfully for Aaron Hirshka")
    } else {
      console.log("✅ Owner account already exists for Aaron Hirshka")
    }
  } catch (error) {
    console.error("❌ Error initializing owner account:", error)
  }
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("🔄 Initializing database...")

    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT false,
        is_profile_verified BOOLEAN DEFAULT false,
        avatar_url TEXT,
        bio TEXT,
        location VARCHAR(100),
        website VARCHAR(255),
        warning_count INTEGER DEFAULT 0,
        suspension_reason TEXT,
        suspension_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `

    // Create user_sessions table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create recipes table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS recipes (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        author_id INTEGER NOT NULL REFERENCES users(id),
        category VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        prep_time_minutes INTEGER DEFAULT 0,
        cook_time_minutes INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 1,
        image_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        moderation_status VARCHAR(20) DEFAULT 'pending',
        moderation_notes TEXT,
        moderated_by INTEGER REFERENCES users(id),
        moderated_at TIMESTAMP,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Initialize owner account
    await initializeOwnerAccount()

    console.log("✅ Database initialized successfully")
  } catch (error) {
    console.error("❌ Database initialization failed:", error)
    throw error
  }
}

// Stack Auth Config - REQUIRED EXPORT
export function getStackAuthConfig() {
  return {
    projectId: process.env.STACK_PROJECT_ID,
    clientKey: process.env.STACK_CLIENT_KEY,
    serverKey: process.env.STACK_SERVER_KEY,
    baseUrl: process.env.STACK_BASE_URL || process.env.STACK_API_URL,
    jwksUrl: process.env.STACK_JWKS_URL,
  }
}

export const mockDatabase = {
  users: mockUsers,
  recipes: mockRecipes,
  sessions: mockSessions,
}
