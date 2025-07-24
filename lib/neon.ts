import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

// Initialize SQL connection with fallback
export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null

export interface User {
  id: number // Changed from string to number
  username: string
  email: string
  password_hash: string
  role: string
  avatar?: string
  is_verified: boolean
  created_at: string
  bio?: string
  location?: string
  website?: string
}

export interface Recipe {
  id: number // Changed from string to number
  title: string
  description?: string
  author_id: number // Changed from string to number
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  ingredients: string
  instructions: string
  image_url?: string
  rating: number
  review_count: number
  view_count: number
  moderation_status: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Session {
  id: number // Changed from string to number
  user_id: number // Changed from string to number
  token: string
  expires_at: string
  created_at: string
}

// Mock data for when database is not available
const mockUsers = new Map<number, User>()
const mockRecipes = new Map<number, Recipe>()
const mockSessions = new Map<number, Session>()

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
    is_verified: true,
    created_at: new Date().toISOString(),
    bio: "",
    location: "",
    website: "",
  }

  const adminPasswordHash = await bcrypt.hash("admin123", 12)
  const adminUser: User = {
    id: 2,
    username: "Admin User",
    email: "admin@justthedamnrecipe.net",
    password_hash: adminPasswordHash,
    role: "admin",
    is_verified: true,
    created_at: new Date().toISOString(),
    bio: "",
    location: "",
    website: "",
  }

  mockUsers.set(ownerUser.id, ownerUser)
  mockUsers.set(adminUser.id, adminUser)

  // Add sample recipes
  const sampleRecipe: Recipe = {
    id: 1,
    title: "Perfect Scrambled Eggs",
    description: "Creamy, fluffy scrambled eggs made the right way",
    author_id: 1,
    author_username: "Aaron Hirshka",
    category: "Breakfast",
    difficulty: "Easy",
    prep_time_minutes: 2,
    cook_time_minutes: 5,
    servings: 2,
    ingredients: "3 large eggs\n2 tbsp butter\n2 tbsp heavy cream\nSalt and pepper to taste",
    instructions:
      "1. Crack eggs into bowl\n2. Add cream and whisk\n3. Heat butter in pan\n4. Add eggs and stir constantly\n5. Remove from heat when still slightly wet",
    rating: 4.8,
    review_count: 24,
    view_count: 156,
    moderation_status: "approved",
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  mockRecipes.set(sampleRecipe.id, sampleRecipe)
}

// Initialize mock data
initializeMockData()

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    if (sql) {
      const result = await sql`
        SELECT * FROM users WHERE email = ${email} LIMIT 1
      `
      return (result[0] as User) || null
    } else {
      // Use mock data
      const user = Array.from(mockUsers.values()).find((u) => u.email === email)
      return user || null
    }
  } catch (error) {
    console.error("Error finding user by email:", error)
    // Fallback to mock data
    const user = Array.from(mockUsers.values()).find((u) => u.email === email)
    return user || null
  }
}

export async function findUserById(id: number): Promise<User | null> {
  try {
    if (sql) {
      const result = await sql`
        SELECT * FROM users WHERE id = ${id} LIMIT 1
      `
      return (result[0] as User) || null
    } else {
      return mockUsers.get(id) || null
    }
  } catch (error) {
    console.error("Error finding user by ID:", error)
    return mockUsers.get(id) || null
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password_hash: string
  role: string
  is_verified: boolean
}): Promise<User> {
  try {
    if (sql) {
      const result = await sql`
        INSERT INTO users (username, email, password_hash, role, is_verified, created_at)
        VALUES (${userData.username}, ${userData.email}, ${userData.password_hash}, ${userData.role}, ${userData.is_verified}, NOW())
        RETURNING *
      `
      return result[0] as User
    } else {
      // Use mock data
      const newUser: User = {
        ...userData,
        id: mockUsers.size + 1,
        created_at: new Date().toISOString(),
        bio: "",
        location: "",
        website: "",
      }
      mockUsers.set(newUser.id, newUser)
      return newUser
    }
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | null> {
  try {
    if (sql) {
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(", ")

      const values = [id, ...Object.values(updates)]

      const result = await sql`
        UPDATE users SET ${sql.unsafe(setClause)} WHERE id = $1 RETURNING *
      `.apply(null, values)

      return (result[0] as User) || null
    } else {
      const user = mockUsers.get(id)
      if (user) {
        const updatedUser = { ...user, ...updates }
        mockUsers.set(id, updatedUser)
        return updatedUser
      }
      return null
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return null
  }
}

export async function createSession(userId: number, token: string): Promise<Session> {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    if (sql) {
      const result = await sql`
        INSERT INTO user_sessions (user_id, token, expires_at, created_at)
        VALUES (${userId}, ${token}, ${expiresAt.toISOString()}, NOW())
        RETURNING *
      `
      return result[0] as Session
    } else {
      const session: Session = {
        id: mockSessions.size + 1,
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }
      mockSessions.set(session.id, session)
      return session
    }
  } catch (error) {
    console.error("Error creating session:", error)
    throw error
  }
}

export async function findSessionByToken(token: string): Promise<Session | null> {
  try {
    if (sql) {
      const result = await sql`
        SELECT * FROM user_sessions WHERE token = ${token} AND expires_at > NOW() LIMIT 1
      `
      return (result[0] as Session) || null
    } else {
      const session = Array.from(mockSessions.values()).find((s) => s.token === token)
      if (session && new Date(session.expires_at) > new Date()) {
        return session
      }
      return null
    }
  } catch (error) {
    console.error("Error finding session:", error)
    return null
  }
}

export async function deleteSession(token: string): Promise<boolean> {
  try {
    if (sql) {
      await sql`
        DELETE FROM user_sessions WHERE token = ${token}
      `
      return true
    } else {
      const session = Array.from(mockSessions.values()).find((s) => s.token === token)
      if (session) {
        mockSessions.delete(session.id)
        return true
      }
      return false
    }
  } catch (error) {
    console.error("Error deleting session:", error)
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
        is_verified: true,
      })

      console.log("Owner account created successfully for Aaron Hirshka")
    } else {
      console.log("Owner account already exists for Aaron Hirshka")
    }
  } catch (error) {
    console.error("Error initializing owner account:", error)
  }
}

export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    if (sql) {
      const result = await sql`
        SELECT * FROM recipes WHERE is_published = true ORDER BY created_at DESC
      `
      return result as Recipe[]
    } else {
      return Array.from(mockRecipes.values()).filter((r) => r.is_published)
    }
  } catch (error) {
    console.error("Error getting recipes:", error)
    return Array.from(mockRecipes.values()).filter((r) => r.is_published)
  }
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  try {
    if (sql) {
      const result = await sql`
        SELECT * FROM recipes WHERE id = ${id} LIMIT 1
      `
      return (result[0] as Recipe) || null
    } else {
      return mockRecipes.get(id) || null
    }
  } catch (error) {
    console.error("Error getting recipe by ID:", error)
    return mockRecipes.get(id) || null
  }
}

export async function createRecipe(recipeData: any): Promise<Recipe> {
  try {
    if (sql) {
      const result = await sql`
        INSERT INTO recipes (
          title, description, author_id, author_username, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, ingredients, instructions,
          image_url, moderation_status, is_published, created_at
        ) VALUES (
          ${recipeData.title}, ${recipeData.description}, ${recipeData.author_id},
          ${recipeData.author_username}, ${recipeData.category}, ${recipeData.difficulty},
          ${recipeData.prep_time_minutes}, ${recipeData.cook_time_minutes}, ${recipeData.servings},
          ${recipeData.ingredients}, ${recipeData.instructions}, ${recipeData.image_url},
          'pending', false, NOW()
        ) RETURNING *
      `
      return result[0] as Recipe
    } else {
      const newRecipe: Recipe = {
        ...recipeData,
        id: mockRecipes.size + 1,
        moderation_status: "pending",
        is_published: false,
        rating: 0,
        review_count: 0,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockRecipes.set(newRecipe.id, newRecipe)
      return newRecipe
    }
  } catch (error) {
    console.error("Error creating recipe:", error)
    throw error
  }
}

export async function getPendingRecipes(): Promise<Recipe[]> {
  try {
    if (sql) {
      const result = await sql`
        SELECT * FROM recipes WHERE moderation_status = 'pending' ORDER BY created_at DESC
      `
      return result as Recipe[]
    } else {
      return Array.from(mockRecipes.values()).filter((r) => r.moderation_status === "pending")
    }
  } catch (error) {
    console.error("Error getting pending recipes:", error)
    return Array.from(mockRecipes.values()).filter((r) => r.moderation_status === "pending")
  }
}

export async function moderateRecipe(
  id: number,
  action: "approve" | "reject",
  moderatorId: number,
): Promise<Recipe | null> {
  try {
    const status = action === "approve" ? "approved" : "rejected"
    const isPublished = action === "approve"

    if (sql) {
      const result = await sql`
        UPDATE recipes 
        SET moderation_status = ${status}, is_published = ${isPublished}, moderated_by = ${moderatorId}, moderated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      return (result[0] as Recipe) || null
    } else {
      const recipe = mockRecipes.get(id)
      if (recipe) {
        const updatedRecipe = {
          ...recipe,
          moderation_status: status,
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        }
        mockRecipes.set(id, updatedRecipe)
        return updatedRecipe
      }
      return null
    }
  } catch (error) {
    console.error("Error moderating recipe:", error)
    return null
  }
}

export async function getAdminStats() {
  try {
    if (sql) {
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
    } else {
      return {
        users: mockUsers.size,
        recipes: Array.from(mockRecipes.values()).filter((r) => r.is_published).length,
        pending: Array.from(mockRecipes.values()).filter((r) => r.moderation_status === "pending").length,
      }
    }
  } catch (error) {
    console.error("Error getting admin stats:", error)
    return { users: 0, recipes: 0, pending: 0 }
  }
}

export async function initializeDatabase(): Promise<boolean> {
  try {
    console.log("Initializing database...")

    if (sql) {
      // Create tables if they don't exist
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          avatar TEXT,
          is_verified BOOLEAN DEFAULT false,
          bio TEXT,
          location VARCHAR(255),
          website VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS recipes (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          author_username VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          difficulty VARCHAR(50) NOT NULL,
          prep_time_minutes INTEGER NOT NULL,
          cook_time_minutes INTEGER NOT NULL,
          servings INTEGER NOT NULL,
          ingredients TEXT NOT NULL,
          instructions TEXT NOT NULL,
          image_url TEXT,
          rating DECIMAL(3,2) DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          view_count INTEGER DEFAULT 0,
          moderation_status VARCHAR(50) DEFAULT 'pending',
          is_published BOOLEAN DEFAULT false,
          moderated_by INTEGER REFERENCES users(id),
          moderated_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `
    }

    // Initialize owner account
    await initializeOwnerAccount()

    console.log("Database initialized successfully")
    return true
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return false
  }
}

export const mockDatabase = {
  users: mockUsers,
  recipes: mockRecipes,
  sessions: mockSessions,
}
