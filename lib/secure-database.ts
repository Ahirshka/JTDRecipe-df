import { getErrorMessage } from "./error-utils"

export interface SecureUser {
  id: string
  username: string
  email: string
  role: string
  status: string
  login_attempts: number
  locked_until?: string
  last_login_at?: string
  warning_count: number
  email_verified: boolean
  provider: string
  password_hash?: string
  created_at: string
  updated_at: string
}

export interface SecureRecipe {
  id: string
  title: string
  description?: string
  author_id: string
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  moderation_status: "pending" | "approved" | "rejected"
  moderation_notes?: string
  view_count: number
  rating: number
  review_count: number
  is_published?: boolean
  created_at: string
  updated_at: string
}

// In-memory database for demonstration purposes
const users: SecureUser[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    status: "active",
    login_attempts: 0,
    warning_count: 0,
    email_verified: true,
    provider: "email",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    username: "user1",
    email: "user1@example.com",
    role: "user",
    status: "active",
    login_attempts: 0,
    warning_count: 0,
    email_verified: true,
    provider: "email",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const recipes: SecureRecipe[] = [
  {
    id: "1",
    title: "Chocolate Chip Cookies",
    description: "Classic homemade chocolate chip cookies",
    author_id: "1",
    author_username: "admin",
    category: "desserts",
    difficulty: "easy",
    prep_time_minutes: 15,
    cook_time_minutes: 12,
    servings: 24,
    moderation_status: "approved",
    view_count: 150,
    rating: 4.8,
    review_count: 12,
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

class SecureDatabase {
  async getAllUsers(requesterId: string): Promise<SecureUser[]> {
    try {
      return users
    } catch (error) {
      console.error("Error fetching users:", getErrorMessage(error))
      return []
    }
  }

  async searchUsers(requesterId: string, query: string): Promise<SecureUser[]> {
    try {
      const lowercaseQuery = query.toLowerCase()
      return users.filter(
        (user) =>
          user.username.toLowerCase().includes(lowercaseQuery) || user.email.toLowerCase().includes(lowercaseQuery),
      )
    } catch (error) {
      console.error("Error searching users:", getErrorMessage(error))
      return []
    }
  }

  async suspendUser(moderatorId: string, userId: string, reason: string, durationDays: number): Promise<boolean> {
    try {
      const userIndex = users.findIndex((user) => user.id === userId)
      if (userIndex === -1) return false

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + durationDays)

      users[userIndex] = {
        ...users[userIndex],
        status: "suspended",
        locked_until: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }

      return true
    } catch (error) {
      console.error("Error suspending user:", getErrorMessage(error))
      return false
    }
  }

  async banUser(moderatorId: string, userId: string, reason: string): Promise<boolean> {
    try {
      const userIndex = users.findIndex((user) => user.id === userId)
      if (userIndex === -1) return false

      users[userIndex] = {
        ...users[userIndex],
        status: "banned",
        updated_at: new Date().toISOString(),
      }

      return true
    } catch (error) {
      console.error("Error banning user:", getErrorMessage(error))
      return false
    }
  }

  async changeUserRole(moderatorId: string, userId: string, newRole: string): Promise<boolean> {
    try {
      const userIndex = users.findIndex((user) => user.id === userId)
      if (userIndex === -1) return false

      users[userIndex] = {
        ...users[userIndex],
        role: newRole,
        updated_at: new Date().toISOString(),
      }

      return true
    } catch (error) {
      console.error("Error changing user role:", getErrorMessage(error))
      return false
    }
  }

  async getAllRecipes(requesterId?: string): Promise<SecureRecipe[]> {
    try {
      return recipes
    } catch (error) {
      console.error("Error fetching recipes:", getErrorMessage(error))
      return []
    }
  }

  async getRecipeById(recipeId: string, requesterId?: string): Promise<SecureRecipe | null> {
    try {
      return recipes.find((recipe) => recipe.id === recipeId) || null
    } catch (error) {
      console.error("Error fetching recipe:", getErrorMessage(error))
      return null
    }
  }

  async moderateRecipe(
    moderatorId: string,
    recipeId: string,
    status: "approved" | "rejected",
    notes?: string,
  ): Promise<boolean> {
    try {
      const recipeIndex = recipes.findIndex((recipe) => recipe.id === recipeId)
      if (recipeIndex === -1) return false

      recipes[recipeIndex] = {
        ...recipes[recipeIndex],
        moderation_status: status,
        moderation_notes: notes,
        is_published: status === "approved",
        updated_at: new Date().toISOString(),
      }

      return true
    } catch (error) {
      console.error("Error moderating recipe:", getErrorMessage(error))
      return false
    }
  }

  async deleteRecipe(moderatorId: string, recipeId: string): Promise<boolean> {
    try {
      const recipeIndex = recipes.findIndex((recipe) => recipe.id === recipeId)
      if (recipeIndex === -1) return false

      recipes.splice(recipeIndex, 1)
      return true
    } catch (error) {
      console.error("Error deleting recipe:", getErrorMessage(error))
      return false
    }
  }
}

// Export singleton instance
export const secureDB = new SecureDatabase()
