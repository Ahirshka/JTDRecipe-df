export interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
  status: string
  is_verified: boolean
  created_at: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

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
  image_url?: string
  author_id: string
  author_name: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface CreateRecipeData {
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  prep_time: number
  cook_time: number
  servings: number
  difficulty: string
  category: string
  image_url?: string
}

export interface RecipeFilters {
  category?: string
  difficulty?: string
  max_prep_time?: number
  max_cook_time?: number
  search?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SessionData {
  user: User
  expires: string
}
