import { executeQuery, executeTransaction } from "./turso"
import bcrypt from "bcryptjs"

export interface TursoUser {
  id: string
  username: string
  email: string
  password_hash?: string
  avatar?: string
  provider: string
  social_id?: string
  role: UserRole
  status: UserStatus
  is_verified: boolean
  is_suspended: boolean
  suspension_reason?: string
  suspension_expires_at?: string
  warning_count: number
  login_attempts: number
  locked_until?: string
  email_verified: boolean
  verification_token?: string
  reset_token?: string
  reset_token_expires?: string
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface TursoRecipe {
  id: string
  title: string
  description?: string
  author_id: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  rating: number
  review_count: number
  view_count: number
  is_published: boolean
  is_featured: boolean
  moderation_status: "pending" | "approved" | "rejected"
  moderation_notes?: string
  created_at: string
  updated_at: string
  // Joined data
  author_username?: string
  ingredients?: RecipeIngredient[]
  instructions?: RecipeInstruction[]
  tags?: string[]
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient: string
  amount?: string
  unit?: string
  order_index: number
}

export interface RecipeInstruction {
  id: string
  recipe_id: string
  instruction: string
  step_number: number
  image_url?: string
}

export interface UserSession {
  id: string
  user_id: string
  token: string
  expires_at: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

export type UserRole = "user" | "moderator" | "admin" | "owner"
export type UserStatus = "active" | "suspended" | "banned" | "pending"

class TursoDatabase {
  private maxLoginAttempts = 5
  private lockoutDuration = 30 * 60 * 1000 // 30 minutes

  // Password hashing
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  // Token generation
  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2)
  }

  // User Management
  async createUser(userData: {
    username: string
    email: string
    password?: string
    role?: UserRole
    provider: string
    social_id?: string
    avatar?: string
  }): Promise<TursoUser> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const passwordHash = userData.password ? await this.hashPassword(userData.password) : null
    const userId = this.generateId()

    const sql = `
      INSERT INTO users (
        id, username, email, password_hash, avatar, provider, social_id, role,
        is_verified, email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `

    await executeQuery(sql, [
      userId,
      userData.username,
      userData.email,
      passwordHash,
      userData.avatar || null,
      userData.provider,
      userData.social_id || null,
      userData.role || "user",
      userData.provider !== "email" ? 1 : 0, // Social logins are auto-verified
      userData.provider !== "email" ? 1 : 0,
    ])

    // Create user profile
    await executeQuery(
      `INSERT INTO user_profiles (user_id, cooking_experience, favorite_cuisines, dietary_restrictions, social_links) 
       VALUES (?, 'beginner', '[]', '[]', '{}')`,
      [userId],
    )

    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error("Failed to create user")
    }

    return user
  }

  async authenticateUser(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: TursoUser; session: UserSession } | null> {
    const user = await this.getUserByEmail(email)
    if (!user) {
      return null
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error("Account is temporarily locked due to too many failed login attempts")
    }

    // Check account status
    if (user.status === "banned") {
      throw new Error("Account has been banned")
    }

    if (user.status === "suspended") {
      throw new Error("Account is currently suspended")
    }

    // Verify password
    if (!user.password_hash) {
      throw new Error("Invalid login method")
    }

    const isValidPassword = await this.verifyPassword(password, user.password_hash)

    if (!isValidPassword) {
      // Increment login attempts
      const newAttempts = user.login_attempts + 1
      let lockedUntil = null

      if (newAttempts >= this.maxLoginAttempts) {
        lockedUntil = new Date(Date.now() + this.lockoutDuration).toISOString()
      }

      await executeQuery("UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?", [
        newAttempts,
        lockedUntil,
        user.id,
      ])

      return null
    }

    // Reset login attempts and update last login
    await executeQuery(
      "UPDATE users SET login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id],
    )

    // Create session
    const session = await this.createSession(user.id, ipAddress, userAgent)

    return { user, session }
  }

  async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<UserSession> {
    const sessionId = this.generateId()
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    await executeQuery(
      `INSERT INTO user_sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [sessionId, userId, token, expiresAt, ipAddress || null, userAgent || null],
    )

    return {
      id: sessionId,
      user_id: userId,
      token,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString(),
    }
  }

  async validateSession(token: string): Promise<TursoUser | null> {
    const result = await executeQuery(
      "SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP",
      [token],
    )

    if (result.rows.length === 0) {
      return null
    }

    const userId = result.rows[0].user_id as string
    return await this.getUserById(userId)
  }

  async revokeSession(token: string): Promise<void> {
    await executeQuery("DELETE FROM user_sessions WHERE token = ?", [token])
  }

  async getUserById(id: string): Promise<TursoUser | null> {
    const result = await executeQuery("SELECT * FROM users WHERE id = ?", [id])

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUser(result.rows[0])
  }

  async getUserByEmail(email: string): Promise<TursoUser | null> {
    const result = await executeQuery("SELECT * FROM users WHERE email = ?", [email])

    if (result.rows.length === 0) {
      return null
    }

    return this.mapRowToUser(result.rows[0])
  }

  // Recipe Management
  async createRecipe(recipeData: {
    title: string
    description?: string
    author_id: string
    category: string
    difficulty: string
    prep_time_minutes: number
    cook_time_minutes: number
    servings: number
    image_url?: string
    ingredients: Array<{ ingredient: string; amount?: string; unit?: string }>
    instructions: Array<{ instruction: string; step_number: number }>
    tags: string[]
  }): Promise<string> {
    const recipeId = this.generateId()

    const queries = [
      {
        sql: `INSERT INTO recipes (
          id, title, description, author_id, category, difficulty,
          prep_time_minutes, cook_time_minutes, servings, image_url,
          moderation_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          recipeId,
          recipeData.title,
          recipeData.description || null,
          recipeData.author_id,
          recipeData.category,
          recipeData.difficulty,
          recipeData.prep_time_minutes,
          recipeData.cook_time_minutes,
          recipeData.servings,
          recipeData.image_url || null,
        ],
      },
    ]

    // Add ingredients
    recipeData.ingredients.forEach((ingredient, index) => {
      queries.push({
        sql: `INSERT INTO recipe_ingredients (id, recipe_id, ingredient, amount, unit, order_index)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          this.generateId(),
          recipeId,
          ingredient.ingredient,
          ingredient.amount || null,
          ingredient.unit || null,
          index,
        ],
      })
    })

    // Add instructions
    recipeData.instructions.forEach((instruction) => {
      queries.push({
        sql: `INSERT INTO recipe_instructions (id, recipe_id, instruction, step_number)
              VALUES (?, ?, ?, ?)`,
        args: [this.generateId(), recipeId, instruction.instruction, instruction.step_number],
      })
    })

    // Add tags
    recipeData.tags.forEach((tag) => {
      queries.push({
        sql: `INSERT INTO recipe_tags (id, recipe_id, tag) VALUES (?, ?, ?)`,
        args: [this.generateId(), recipeId, tag],
      })
    })

    await executeTransaction(queries)
    return recipeId
  }

  async getRecipeById(recipeId: string, includeDetails = true): Promise<TursoRecipe | null> {
    const result = await executeQuery(
      `SELECT r.*, u.username as author_username 
       FROM recipes r 
       JOIN users u ON r.author_id = u.id 
       WHERE r.id = ?`,
      [recipeId],
    )

    if (result.rows.length === 0) {
      return null
    }

    const recipe = this.mapRowToRecipe(result.rows[0])

    if (includeDetails) {
      // Get ingredients
      const ingredientsResult = await executeQuery(
        "SELECT * FROM recipe_ingredients WHERE recipe_id = ? ORDER BY order_index",
        [recipeId],
      )
      recipe.ingredients = ingredientsResult.rows.map((row) => this.mapRowToIngredient(row))

      // Get instructions
      const instructionsResult = await executeQuery(
        "SELECT * FROM recipe_instructions WHERE recipe_id = ? ORDER BY step_number",
        [recipeId],
      )
      recipe.instructions = instructionsResult.rows.map((row) => this.mapRowToInstruction(row))

      // Get tags
      const tagsResult = await executeQuery("SELECT tag FROM recipe_tags WHERE recipe_id = ?", [recipeId])
      recipe.tags = tagsResult.rows.map((row) => row.tag as string)
    }

    return recipe
  }

  async getAllRecipes(
    filters: {
      status?: "pending" | "approved" | "rejected"
      published?: boolean
      authorId?: string
      category?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<TursoRecipe[]> {
    let sql = `
      SELECT r.*, u.username as author_username 
      FROM recipes r 
      JOIN users u ON r.author_id = u.id 
      WHERE 1=1
    `
    const params: any[] = []

    if (filters.status) {
      sql += " AND r.moderation_status = ?"
      params.push(filters.status)
    }

    if (filters.published !== undefined) {
      sql += " AND r.is_published = ?"
      params.push(filters.published ? 1 : 0)
    }

    if (filters.authorId) {
      sql += " AND r.author_id = ?"
      params.push(filters.authorId)
    }

    if (filters.category) {
      sql += " AND r.category = ?"
      params.push(filters.category)
    }

    sql += " ORDER BY r.created_at DESC"

    if (filters.limit) {
      sql += " LIMIT ?"
      params.push(filters.limit)
    }

    if (filters.offset) {
      sql += " OFFSET ?"
      params.push(filters.offset)
    }

    const result = await executeQuery(sql, params)
    return result.rows.map((row) => this.mapRowToRecipe(row))
  }

  async moderateRecipe(
    moderatorId: string,
    recipeId: string,
    status: "approved" | "rejected",
    notes?: string,
  ): Promise<boolean> {
    const queries = [
      {
        sql: `UPDATE recipes SET 
              moderation_status = ?, 
              moderation_notes = ?, 
              is_published = ?,
              updated_at = CURRENT_TIMESTAMP 
              WHERE id = ?`,
        args: [status, notes || null, status === "approved" ? 1 : 0, recipeId],
      },
      {
        sql: `INSERT INTO moderation_logs (id, moderator_id, target_type, target_id, action, reason, created_at)
              VALUES (?, ?, 'recipe', ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [this.generateId(), moderatorId, recipeId, `recipe_${status}`, notes || ""],
      },
    ]

    await executeTransaction(queries)
    return true
  }

  // User interactions
  async toggleFavorite(userId: string, recipeId: string): Promise<boolean> {
    // Check if already favorited
    const existing = await executeQuery("SELECT id FROM user_favorites WHERE user_id = ? AND recipe_id = ?", [
      userId,
      recipeId,
    ])

    if (existing.rows.length > 0) {
      // Remove favorite
      await executeQuery("DELETE FROM user_favorites WHERE user_id = ? AND recipe_id = ?", [userId, recipeId])
      return false
    } else {
      // Add favorite
      await executeQuery(
        "INSERT INTO user_favorites (id, user_id, recipe_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [this.generateId(), userId, recipeId],
      )
      return true
    }
  }

  async rateRecipe(userId: string, recipeId: string, rating: number): Promise<void> {
    // Insert or update rating
    await executeQuery(
      `INSERT INTO recipe_ratings (id, user_id, recipe_id, rating, created_at, updated_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, recipe_id) DO UPDATE SET
       rating = excluded.rating, updated_at = CURRENT_TIMESTAMP`,
      [this.generateId(), userId, recipeId, rating],
    )

    // Update recipe rating average
    const avgResult = await executeQuery(
      "SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM recipe_ratings WHERE recipe_id = ?",
      [recipeId],
    )

    if (avgResult.rows.length > 0) {
      const avgRating = avgResult.rows[0].avg_rating as number
      const reviewCount = avgResult.rows[0].count as number

      await executeQuery("UPDATE recipes SET rating = ?, review_count = ? WHERE id = ?", [
        avgRating,
        reviewCount,
        recipeId,
      ])
    }
  }

  async getUserRating(userId: string, recipeId: string): Promise<number | null> {
    const result = await executeQuery("SELECT rating FROM recipe_ratings WHERE user_id = ? AND recipe_id = ?", [
      userId,
      recipeId,
    ])

    return result.rows.length > 0 ? (result.rows[0].rating as number) : null
  }

  async isFavorited(userId: string, recipeId: string): Promise<boolean> {
    const result = await executeQuery("SELECT id FROM user_favorites WHERE user_id = ? AND recipe_id = ?", [
      userId,
      recipeId,
    ])

    return result.rows.length > 0
  }

  // Helper methods
  private mapRowToUser(row: any): TursoUser {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password_hash: row.password_hash,
      avatar: row.avatar,
      provider: row.provider,
      social_id: row.social_id,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      is_verified: Boolean(row.is_verified),
      is_suspended: Boolean(row.is_suspended),
      suspension_reason: row.suspension_reason,
      suspension_expires_at: row.suspension_expires_at,
      warning_count: row.warning_count || 0,
      login_attempts: row.login_attempts || 0,
      locked_until: row.locked_until,
      email_verified: Boolean(row.email_verified),
      verification_token: row.verification_token,
      reset_token: row.reset_token,
      reset_token_expires: row.reset_token_expires,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_login_at: row.last_login_at,
    }
  }

  private mapRowToRecipe(row: any): TursoRecipe {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      author_id: row.author_id,
      category: row.category,
      difficulty: row.difficulty,
      prep_time_minutes: row.prep_time_minutes || 0,
      cook_time_minutes: row.cook_time_minutes || 0,
      servings: row.servings || 1,
      image_url: row.image_url,
      rating: row.rating || 0,
      review_count: row.review_count || 0,
      view_count: row.view_count || 0,
      is_published: Boolean(row.is_published),
      is_featured: Boolean(row.is_featured),
      moderation_status: row.moderation_status,
      moderation_notes: row.moderation_notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author_username: row.author_username,
    }
  }

  private mapRowToIngredient(row: any): RecipeIngredient {
    return {
      id: row.id,
      recipe_id: row.recipe_id,
      ingredient: row.ingredient,
      amount: row.amount,
      unit: row.unit,
      order_index: row.order_index || 0,
    }
  }

  private mapRowToInstruction(row: any): RecipeInstruction {
    return {
      id: row.id,
      recipe_id: row.recipe_id,
      instruction: row.instruction,
      step_number: row.step_number,
      image_url: row.image_url,
    }
  }
}

export const tursoDatabase = new TursoDatabase()
