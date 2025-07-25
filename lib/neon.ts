import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

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
}

export interface Recipe {
  id: string
  title: string
  description: string
  author_id: number
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  rating: number
  review_count: number
  view_count: number
  moderation_status: string
  moderation_notes?: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  recipe_id: number
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
  recipe_id: number
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

// Stack Auth configuration - REQUIRED EXPORT
export function getStackAuthConfig() {
  return {
    projectId: process.env.STACK_PROJECT_ID,
    clientKey: process.env.STACK_CLIENT_KEY,
    serverKey: process.env.STACK_SERVER_KEY,
    baseUrl: process.env.STACK_BASE_URL || process.env.STACK_API_URL,
    jwksUrl: process.env.STACK_JWKS_URL,
  }
}

// Mock data for when database is not available
const mockUsers = new Map<number, User>()
const mockRecipes = new Map<string, Recipe>()
const mockSessions = new Map<number, Session>()
const mockComments = new Map<number, Comment>()
const mockRatings = new Map<number, Rating>()

// Initialize mock data
const initializeMockData = async () => {
  if (mockUsers.size > 0) return // Already initialized

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

  const adminPasswordHash = await bcrypt.hash("admin123", 12)
  const adminUser: User = {
    id: 2,
    username: "Admin User",
    email: "admin@justthedamnrecipe.net",
    password_hash: adminPasswordHash,
    role: "admin",
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
  mockUsers.set(adminUser.id, adminUser)

  // Add sample recipes
  const sampleRecipe: Recipe = {
    id: "recipe_1",
    title: "Perfect Scrambled Eggs",
    description: "Creamy, fluffy scrambled eggs made the right way",
    author_id: 1,
    category: "Breakfast",
    difficulty: "Easy",
    prep_time_minutes: 2,
    cook_time_minutes: 5,
    servings: 2,
    ingredients: ["3 large eggs", "2 tbsp butter", "2 tbsp heavy cream", "Salt and pepper to taste"],
    instructions: [
      "Crack eggs into bowl",
      "Add cream and whisk",
      "Heat butter in pan",
      "Add eggs and stir constantly",
      "Remove from heat when still slightly wet",
    ],
    rating: 4.8,
    review_count: 24,
    view_count: 156,
    moderation_status: "approved",
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  mockRecipes.set(sampleRecipe.id, sampleRecipe)

  // Add sample comments
  const sampleComment: Comment = {
    id: 1,
    recipe_id: 1,
    user_id: 1,
    username: "Aaron Hirshka",
    content: "Great recipe!",
    status: "approved",
    is_flagged: false,
    created_at: new Date().toISOString(),
  }

  mockComments.set(sampleComment.id, sampleComment)

  // Add sample ratings
  const sampleRating: Rating = {
    id: 1,
    recipe_id: 1,
    user_id: 1,
    rating: 5,
    created_at: new Date().toISOString(),
  }

  mockRatings.set(sampleRating.id, sampleRating)
}

// Initialize mock data
initializeMockData()

// Helper function to find user by ID
export async function findUserById(id: number): Promise<User | null> {
  try {
    const users = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`
    return users[0] || null
  } catch (error) {
    console.error("Error finding user by ID:", error)
    return null
  }
}

// Helper function to find user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
    return users[0] || null
  } catch (error) {
    console.error("Error finding user by email:", error)
    return null
  }
}

// Get all users - REQUIRED EXPORT
export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at DESC`
    return users as User[]
  } catch (error) {
    console.error("Error getting all users:", error)
    return Array.from(mockUsers.values())
  }
}

// Update user by ID - REQUIRED EXPORT
export async function updateUserById(id: number, updates: Partial<User>): Promise<User | null> {
  try {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = [id, ...Object.values(updates)]

    const result = await sql`
      UPDATE users SET ${sql.unsafe(setClause)}, updated_at = NOW() WHERE id = $1 RETURNING *
    `.apply(null, values)

    return (result[0] as User) || null
  } catch (error) {
    console.error("Error updating user by ID:", error)
    return null
  }
}

// Update user - REQUIRED EXPORT
export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  try {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")

    const values = [id, ...Object.values(updates)]

    const result = await sql`
      UPDATE users SET ${sql.unsafe(setClause)}, updated_at = NOW() WHERE id = $1 RETURNING *
    `.apply(null, values)

    return (result[0] as User) || null
  } catch (error) {
    console.error("Error updating user:", error)
    // Update mock data as fallback
    const user = mockUsers.get(id)
    if (user) {
      const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() }
      mockUsers.set(id, updatedUser)
      return updatedUser
    }
    return null
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password_hash: string
  role?: string
}): Promise<User> {
  try {
    const users = await sql`
      INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
      VALUES (${userData.username}, ${userData.email}, ${userData.password_hash}, ${userData.role || "user"}, NOW(), NOW())
      RETURNING *
    `
    return users[0]
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUserLoginTime(userId: number): Promise<void> {
  try {
    await sql`
      UPDATE users 
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = ${userId}
    `
  } catch (error) {
    console.error("Error updating user login time:", error)
  }
}

export async function createSession(userId: number, token: string): Promise<Session> {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const result = await sql`
      INSERT INTO user_sessions (user_id, token, expires_at, created_at)
      VALUES (${userId}, ${token}, ${expiresAt.toISOString()}, NOW())
      RETURNING *
    `
    return result[0] as Session
  } catch (error) {
    console.error("Error creating session:", error)
    // Create mock session
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
      SELECT * FROM user_sessions WHERE token = ${token} AND expires_at > NOW() LIMIT 1
    `
    return (result[0] as Session) || null
  } catch (error) {
    console.error("Error finding session:", error)
    // Check mock sessions
    for (const [id, session] of mockSessions.entries()) {
      if (session.token === token && new Date(session.expires_at) > new Date()) {
        return session
      }
    }
    return null
  }
}

export async function deleteSession(token: string) {
  try {
    await sql`DELETE FROM user_sessions WHERE token = ${token}`
    return true
  } catch (error) {
    console.error("Error deleting session:", error)
    // Delete from mock sessions
    for (const [id, session] of mockSessions.entries()) {
      if (session.token === token) {
        mockSessions.delete(id)
        break
      }
    }
    return false
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
      })

      console.log("Owner account created successfully for Aaron Hirshka")
    } else {
      console.log("Owner account already exists for Aaron Hirshka")
    }
  } catch (error) {
    console.error("Error initializing owner account:", error)
  }
}

// Helper function to get all recipes
export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const recipes = await sql`
      SELECT * FROM recipes 
      WHERE moderation_status = 'approved' AND is_published = true
      ORDER BY created_at DESC
    `
    return recipes
  } catch (error) {
    console.error("Error getting all recipes:", error)
    return Array.from(mockRecipes.values()).filter((r) => r.moderation_status === "approved")
  }
}

export async function createRecipe(recipeData: {
  title: string
  description: string
  author_id: number
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  ingredients: any[]
  instructions: any[]
  image_url?: string
}): Promise<Recipe> {
  try {
    const recipeId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const recipes = await sql`
      INSERT INTO recipes (
        id, title, description, author_id, category, difficulty,
        prep_time_minutes, cook_time_minutes, servings, image_url,
        moderation_status, is_published, created_at, updated_at
      ) VALUES (
        ${recipeId}, ${recipeData.title}, ${recipeData.description}, ${recipeData.author_id},
        ${recipeData.category}, ${recipeData.difficulty}, ${recipeData.prep_time_minutes},
        ${recipeData.cook_time_minutes}, ${recipeData.servings}, ${recipeData.image_url || null},
        'pending', false, NOW(), NOW()
      )
      RETURNING *
    `

    return recipes[0]
  } catch (error) {
    console.error("Error creating recipe:", error)
    throw error
  }
}

export async function getPendingRecipes(): Promise<Recipe[]> {
  try {
    const result = await sql`
      SELECT * FROM recipes 
      WHERE moderation_status = 'pending' 
      ORDER BY created_at DESC
    `

    return result
  } catch (error) {
    console.error("Error getting pending recipes:", error)
    return Array.from(mockRecipes.values()).filter((r) => r.moderation_status === "pending")
  }
}

export async function moderateRecipe(
  id: string,
  action: "approve" | "reject",
  moderatorId: number,
): Promise<Recipe | null> {
  try {
    const status = action === "approve" ? "approved" : "rejected"
    const isPublished = action === "approve"

    const result = await sql`
      UPDATE recipes 
      SET moderation_status = ${status}, is_published = ${isPublished}, moderated_by = ${moderatorId}, moderated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return (result[0] as Recipe) || null
  } catch (error) {
    console.error("Error moderating recipe:", error)
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

// Helper function to initialize database
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

    // Create comments table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'approved',
        is_flagged BOOLEAN DEFAULT false,
        flagged_reason TEXT,
        flagged_by INTEGER REFERENCES users(id),
        flagged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create ratings table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(recipe_id, user_id)
      )
    `

    // Create email_tokens table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS email_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        token_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
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

export const mockDatabase = {
  users: mockUsers,
  recipes: mockRecipes,
  sessions: mockSessions,
  comments: mockComments,
  ratings: mockRatings,
}
