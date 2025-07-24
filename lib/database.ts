// Database interface for recipe management
export interface DatabaseRecipe {
  id: string
  title: string
  description: string | null
  author_id: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url: string | null
  rating: number
  review_count: number
  view_count: number
  is_published: boolean
  created_at: string
  updated_at: string
  // Joined data
  author_username?: string
  ingredients?: string[]
  instructions?: string[]
  tags?: string[]
}

export interface DatabaseUser {
  id: string
  username: string
  email: string
  password?: string
  avatar?: string
  provider: string
  social_id?: string
  role: string
  status: string
  is_verified: boolean
  is_suspended: boolean
  suspension_reason?: string
  suspension_expires_at?: string
  warning_count: number
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface DatabaseRating {
  id: string
  user_id: string
  recipe_id: string
  rating: number
  review?: string
  created_at: string
  updated_at: string
  username?: string
}

// Database connection (using Web SQL or SQLite in browser)
class RecipeDatabase {
  private db: any = null

  constructor() {
    if (typeof window !== "undefined") {
      // Initialize database connection
      this.initDatabase()
    }
  }

  private initDatabase() {
    // For demo purposes, we'll use localStorage as a simple database
    // In production, this would connect to a real database
    if (!localStorage.getItem("db_initialized")) {
      this.createTables()
      this.seedData()
      localStorage.setItem("db_initialized", "true")
    }
  }

  private createTables() {
    // Initialize with enhanced recipe data including better tags and categories
    const initialRecipes = [
      {
        id: "1",
        title: "Perfect Chocolate Chip Cookies",
        description:
          "These are the most perfect chocolate chip cookies you'll ever make. Crispy edges, chewy centers, and loaded with chocolate chips.",
        author_id: "user1",
        category: "Desserts",
        difficulty: "Easy",
        prep_time_minutes: 15,
        cook_time_minutes: 25,
        servings: 24,
        image_url: "/placeholder.svg?height=400&width=600",
        rating: 4.9,
        review_count: 234,
        view_count: 1250,
        is_published: true,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      },
      {
        id: "2",
        title: "One-Pot Chicken Alfredo",
        description: "Creamy, delicious chicken alfredo made in just one pot for easy cleanup.",
        author_id: "user2",
        category: "Main Course",
        difficulty: "Medium",
        prep_time_minutes: 10,
        cook_time_minutes: 30,
        servings: 4,
        image_url: "/placeholder.svg?height=400&width=600",
        rating: 4.8,
        review_count: 189,
        view_count: 980,
        is_published: true,
        created_at: "2024-01-10T00:00:00Z",
        updated_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "3",
        title: "Fresh Garden Salad",
        description: "A refreshing garden salad with crisp vegetables and homemade vinaigrette.",
        author_id: "user3",
        category: "Appetizer",
        difficulty: "Easy",
        prep_time_minutes: 10,
        cook_time_minutes: 0,
        servings: 4,
        image_url: "/placeholder.svg?height=400&width=600",
        rating: 4.7,
        review_count: 156,
        view_count: 750,
        is_published: true,
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-05T00:00:00Z",
      },
    ]

    const initialUsers = [
      {
        id: "user1",
        username: "BakingMaster",
        email: "baker@example.com",
        provider: "local",
        role: "user",
        status: "active",
        is_verified: true,
        is_suspended: false,
        warning_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "user2",
        username: "QuickCook",
        email: "quick@example.com",
        provider: "local",
        role: "user",
        status: "active",
        is_verified: true,
        is_suspended: false,
        warning_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "user3",
        username: "HealthyEats",
        email: "healthy@example.com",
        provider: "local",
        role: "user",
        status: "active",
        is_verified: true,
        is_suspended: false,
        warning_count: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]

    // Enhanced ingredients with better organization
    const initialIngredients = [
      // Recipe 1 - Chocolate Chip Cookies
      {
        id: "1_ing_1",
        recipe_id: "1",
        ingredient: "2¼ cups all-purpose flour",
        order_index: 1,
        created_at: "2024-01-15T00:00:00Z",
      },
      {
        id: "1_ing_2",
        recipe_id: "1",
        ingredient: "1 tsp baking soda",
        order_index: 2,
        created_at: "2024-01-15T00:00:00Z",
      },
      { id: "1_ing_3", recipe_id: "1", ingredient: "1 tsp salt", order_index: 3, created_at: "2024-01-15T00:00:00Z" },
      {
        id: "1_ing_4",
        recipe_id: "1",
        ingredient: "1 cup butter, softened",
        order_index: 4,
        created_at: "2024-01-15T00:00:00Z",
      },
      {
        id: "1_ing_5",
        recipe_id: "1",
        ingredient: "¾ cup granulated sugar",
        order_index: 5,
        created_at: "2024-01-15T00:00:00Z",
      },
      {
        id: "1_ing_6",
        recipe_id: "1",
        ingredient: "¾ cup packed brown sugar",
        order_index: 6,
        created_at: "2024-01-15T00:00:00Z",
      },
      { id: "1_ing_7", recipe_id: "1", ingredient: "2 large eggs", order_index: 7, created_at: "2024-01-15T00:00:00Z" },
      {
        id: "1_ing_8",
        recipe_id: "1",
        ingredient: "2 tsp vanilla extract",
        order_index: 8,
        created_at: "2024-01-15T00:00:00Z",
      },
      {
        id: "1_ing_9",
        recipe_id: "1",
        ingredient: "2 cups chocolate chips",
        order_index: 9,
        created_at: "2024-01-15T00:00:00Z",
      },

      // Recipe 2 - Chicken Alfredo
      {
        id: "2_ing_1",
        recipe_id: "2",
        ingredient: "1 lb chicken breast, cubed",
        order_index: 1,
        created_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "2_ing_2",
        recipe_id: "2",
        ingredient: "12 oz fettuccine pasta",
        order_index: 2,
        created_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "2_ing_3",
        recipe_id: "2",
        ingredient: "2 cups heavy cream",
        order_index: 3,
        created_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "2_ing_4",
        recipe_id: "2",
        ingredient: "1 cup parmesan cheese",
        order_index: 4,
        created_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "2_ing_5",
        recipe_id: "2",
        ingredient: "3 cloves garlic, minced",
        order_index: 5,
        created_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "2_ing_6",
        recipe_id: "2",
        ingredient: "2 tbsp olive oil",
        order_index: 6,
        created_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "2_ing_7",
        recipe_id: "2",
        ingredient: "Salt and pepper to taste",
        order_index: 7,
        created_at: "2024-01-10T00:00:00Z",
      },
      {
        id: "2_ing_8",
        recipe_id: "2",
        ingredient: "Fresh parsley for garnish",
        order_index: 8,
        created_at: "2024-01-10T00:00:00Z",
      },

      // Recipe 3 - Garden Salad
      {
        id: "3_ing_1",
        recipe_id: "3",
        ingredient: "6 cups mixed greens",
        order_index: 1,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_2",
        recipe_id: "3",
        ingredient: "1 cucumber, sliced",
        order_index: 2,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_3",
        recipe_id: "3",
        ingredient: "2 tomatoes, chopped",
        order_index: 3,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_4",
        recipe_id: "3",
        ingredient: "1 red onion, thinly sliced",
        order_index: 4,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_5",
        recipe_id: "3",
        ingredient: "1 bell pepper, chopped",
        order_index: 5,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_6",
        recipe_id: "3",
        ingredient: "¼ cup olive oil",
        order_index: 6,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_7",
        recipe_id: "3",
        ingredient: "2 tbsp balsamic vinegar",
        order_index: 7,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_8",
        recipe_id: "3",
        ingredient: "1 tsp Dijon mustard",
        order_index: 8,
        created_at: "2024-01-05T00:00:00Z",
      },
      {
        id: "3_ing_9",
        recipe_id: "3",
        ingredient: "Salt and pepper to taste",
        order_index: 9,
        created_at: "2024-01-05T00:00:00Z",
      },
    ]

    // Enhanced tags for better search
    const initialTags = [
      // Recipe 1 tags
      { id: "1_tag_1", recipe_id: "1", tag: "cookies", created_at: "2024-01-15T00:00:00Z" },
      { id: "1_tag_2", recipe_id: "1", tag: "dessert", created_at: "2024-01-15T00:00:00Z" },
      { id: "1_tag_3", recipe_id: "1", tag: "chocolate", created_at: "2024-01-15T00:00:00Z" },
      { id: "1_tag_4", recipe_id: "1", tag: "baking", created_at: "2024-01-15T00:00:00Z" },
      { id: "1_tag_5", recipe_id: "1", tag: "easy", created_at: "2024-01-15T00:00:00Z" },
      { id: "1_tag_6", recipe_id: "1", tag: "sweet", created_at: "2024-01-15T00:00:00Z" },
      { id: "1_tag_7", recipe_id: "1", tag: "comfort food", created_at: "2024-01-15T00:00:00Z" },

      // Recipe 2 tags
      { id: "2_tag_1", recipe_id: "2", tag: "chicken", created_at: "2024-01-10T00:00:00Z" },
      { id: "2_tag_2", recipe_id: "2", tag: "pasta", created_at: "2024-01-10T00:00:00Z" },
      { id: "2_tag_3", recipe_id: "2", tag: "one-pot", created_at: "2024-01-10T00:00:00Z" },
      { id: "2_tag_4", recipe_id: "2", tag: "dinner", created_at: "2024-01-10T00:00:00Z" },
      { id: "2_tag_5", recipe_id: "2", tag: "creamy", created_at: "2024-01-10T00:00:00Z" },
      { id: "2_tag_6", recipe_id: "2", tag: "italian", created_at: "2024-01-10T00:00:00Z" },
      { id: "2_tag_7", recipe_id: "2", tag: "comfort food", created_at: "2024-01-10T00:00:00Z" },

      // Recipe 3 tags
      { id: "3_tag_1", recipe_id: "3", tag: "salad", created_at: "2024-01-05T00:00:00Z" },
      { id: "3_tag_2", recipe_id: "3", tag: "healthy", created_at: "2024-01-05T00:00:00Z" },
      { id: "3_tag_3", recipe_id: "3", tag: "vegetarian", created_at: "2024-01-05T00:00:00Z" },
      { id: "3_tag_4", recipe_id: "3", tag: "fresh", created_at: "2024-01-05T00:00:00Z" },
      { id: "3_tag_5", recipe_id: "3", tag: "quick", created_at: "2024-01-05T00:00:00Z" },
      { id: "3_tag_6", recipe_id: "3", tag: "light", created_at: "2024-01-05T00:00:00Z" },
      { id: "3_tag_7", recipe_id: "3", tag: "summer", created_at: "2024-01-05T00:00:00Z" },
    ]

    localStorage.setItem("db_recipes", JSON.stringify(initialRecipes))
    localStorage.setItem("db_users", JSON.stringify(initialUsers))
    localStorage.setItem("db_ingredients", JSON.stringify(initialIngredients))
    localStorage.setItem("db_tags", JSON.stringify(initialTags))
    localStorage.setItem("db_instructions", JSON.stringify([]))
    localStorage.setItem("db_ratings", JSON.stringify([]))
    localStorage.setItem("db_favorites", JSON.stringify([]))

    console.log("Database tables created with enhanced search data")
  }

  private seedData() {
    // Data is seeded in createTables
    console.log("Database seeded with initial data")
  }

  // Recipe operations
  async getAllRecipes(): Promise<DatabaseRecipe[]> {
    const recipes = JSON.parse(localStorage.getItem("db_recipes") || "[]")
    const users = JSON.parse(localStorage.getItem("db_users") || "[]")

    return recipes.map((recipe: any) => {
      const author = users.find((u: any) => u.id === recipe.author_id)
      return {
        ...recipe,
        author_username: author?.username || "Unknown",
        ingredients: this.getRecipeIngredients(recipe.id),
        instructions: this.getRecipeInstructions(recipe.id),
        tags: this.getRecipeTags(recipe.id),
      }
    })
  }

  async getRecipeById(id: string): Promise<DatabaseRecipe | null> {
    const recipes = await this.getAllRecipes()
    return recipes.find((recipe) => recipe.id === id) || null
  }

  async getRecipesByAuthorId(authorId: string): Promise<DatabaseRecipe[]> {
    const recipes = await this.getAllRecipes()
    return recipes.filter((recipe) => recipe.author_id === authorId)
  }

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
    ingredients: string[]
    instructions: string[]
    tags: string[]
  }): Promise<DatabaseRecipe> {
    const recipes = JSON.parse(localStorage.getItem("db_recipes") || "[]")
    const newRecipe = {
      id: Date.now().toString(),
      title: recipeData.title,
      description: recipeData.description || null,
      author_id: recipeData.author_id,
      category: recipeData.category,
      difficulty: recipeData.difficulty,
      prep_time_minutes: recipeData.prep_time_minutes,
      cook_time_minutes: recipeData.cook_time_minutes,
      servings: recipeData.servings,
      image_url: recipeData.image_url || null,
      rating: 0,
      review_count: 0,
      view_count: 0,
      is_published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    recipes.push(newRecipe)
    localStorage.setItem("db_recipes", JSON.stringify(recipes))

    // Save ingredients
    this.saveRecipeIngredients(newRecipe.id, recipeData.ingredients)

    // Save instructions
    this.saveRecipeInstructions(newRecipe.id, recipeData.instructions)

    // Save tags
    this.saveRecipeTags(newRecipe.id, recipeData.tags)

    return (await this.getRecipeById(newRecipe.id)) as DatabaseRecipe
  }

  async updateRecipeViews(recipeId: string): Promise<void> {
    const recipes = JSON.parse(localStorage.getItem("db_recipes") || "[]")
    const recipeIndex = recipes.findIndex((r: any) => r.id === recipeId)

    if (recipeIndex !== -1) {
      recipes[recipeIndex].view_count += 1
      recipes[recipeIndex].updated_at = new Date().toISOString()
      localStorage.setItem("db_recipes", JSON.stringify(recipes))
    }
  }

  // User operations
  async getUserById(id: string): Promise<DatabaseUser | null> {
    const users = JSON.parse(localStorage.getItem("db_users") || "[]")
    return users.find((user: any) => user.id === id) || null
  }

  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    const users = JSON.parse(localStorage.getItem("db_users") || "[]")
    return users.find((user: any) => user.email === email) || null
  }

  async createUser(userData: Omit<DatabaseUser, "id" | "created_at" | "updated_at">): Promise<DatabaseUser> {
    const users = JSON.parse(localStorage.getItem("db_users") || "[]")
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    users.push(newUser)
    localStorage.setItem("db_users", JSON.stringify(users))
    return newUser
  }

  // Rating operations
  async getUserRating(userId: string, recipeId: string): Promise<number | null> {
    const ratings = JSON.parse(localStorage.getItem("db_ratings") || "[]")
    const rating = ratings.find((r: any) => r.user_id === userId && r.recipe_id === recipeId)
    return rating ? rating.rating : null
  }

  async saveUserRating(userId: string, recipeId: string, rating: number, review?: string): Promise<void> {
    const ratings = JSON.parse(localStorage.getItem("db_ratings") || "[]")
    const existingIndex = ratings.findIndex((r: any) => r.user_id === userId && r.recipe_id === recipeId)

    const ratingData = {
      id: existingIndex >= 0 ? ratings[existingIndex].id : Date.now().toString(),
      user_id: userId,
      recipe_id: recipeId,
      rating,
      review: review || null,
      created_at: existingIndex >= 0 ? ratings[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (existingIndex >= 0) {
      ratings[existingIndex] = ratingData
    } else {
      ratings.push(ratingData)
    }

    localStorage.setItem("db_ratings", JSON.stringify(ratings))
    await this.updateRecipeRating(recipeId)
  }

  // Favorite operations
  async getUserFavorites(userId: string): Promise<string[]> {
    const favorites = JSON.parse(localStorage.getItem("db_favorites") || "[]")
    return favorites.filter((f: any) => f.user_id === userId).map((f: any) => f.recipe_id)
  }

  async toggleUserFavorite(userId: string, recipeId: string): Promise<boolean> {
    const favorites = JSON.parse(localStorage.getItem("db_favorites") || "[]")
    const existingIndex = favorites.findIndex((f: any) => f.user_id === userId && f.recipe_id === recipeId)

    if (existingIndex >= 0) {
      // Remove favorite
      favorites.splice(existingIndex, 1)
      localStorage.setItem("db_favorites", JSON.stringify(favorites))
      return false
    } else {
      // Add favorite
      favorites.push({
        id: Date.now().toString(),
        user_id: userId,
        recipe_id: recipeId,
        created_at: new Date().toISOString(),
      })
      localStorage.setItem("db_favorites", JSON.stringify(favorites))
      return true
    }
  }

  // Helper methods
  private getRecipeIngredients(recipeId: string): string[] {
    const ingredients = JSON.parse(localStorage.getItem("db_ingredients") || "[]")
    return ingredients
      .filter((ing: any) => ing.recipe_id === recipeId)
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((ing: any) => ing.ingredient)
  }

  private getRecipeInstructions(recipeId: string): string[] {
    const instructions = JSON.parse(localStorage.getItem("db_instructions") || "[]")
    return instructions
      .filter((inst: any) => inst.recipe_id === recipeId)
      .sort((a: any, b: any) => a.step_number - b.step_number)
      .map((inst: any) => inst.instruction)
  }

  private getRecipeTags(recipeId: string): string[] {
    const tags = JSON.parse(localStorage.getItem("db_tags") || "[]")
    return tags.filter((tag: any) => tag.recipe_id === recipeId).map((tag: any) => tag.tag)
  }

  private saveRecipeIngredients(recipeId: string, ingredients: string[]): void {
    const allIngredients = JSON.parse(localStorage.getItem("db_ingredients") || "[]")

    ingredients.forEach((ingredient, index) => {
      allIngredients.push({
        id: `${recipeId}_ing_${index}`,
        recipe_id: recipeId,
        ingredient,
        order_index: index + 1,
        created_at: new Date().toISOString(),
      })
    })

    localStorage.setItem("db_ingredients", JSON.stringify(allIngredients))
  }

  private saveRecipeInstructions(recipeId: string, instructions: string[]): void {
    const allInstructions = JSON.parse(localStorage.getItem("db_instructions") || "[]")

    instructions.forEach((instruction, index) => {
      allInstructions.push({
        id: `${recipeId}_inst_${index}`,
        recipe_id: recipeId,
        instruction,
        step_number: index + 1,
        created_at: new Date().toISOString(),
      })
    })

    localStorage.setItem("db_instructions", JSON.stringify(allInstructions))
  }

  private saveRecipeTags(recipeId: string, tags: string[]): void {
    const allTags = JSON.parse(localStorage.getItem("db_tags") || "[]")

    tags.forEach((tag) => {
      allTags.push({
        id: `${recipeId}_tag_${tag}`,
        recipe_id: recipeId,
        tag,
        created_at: new Date().toISOString(),
      })
    })

    localStorage.setItem("db_tags", JSON.stringify(allTags))
  }

  private async updateRecipeRating(recipeId: string): Promise<void> {
    const ratings = JSON.parse(localStorage.getItem("db_ratings") || "[]")
    const recipeRatings = ratings.filter((r: any) => r.recipe_id === recipeId)

    if (recipeRatings.length > 0) {
      const avgRating = recipeRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / recipeRatings.length

      const recipes = JSON.parse(localStorage.getItem("db_recipes") || "[]")
      const recipeIndex = recipes.findIndex((r: any) => r.id === recipeId)

      if (recipeIndex !== -1) {
        recipes[recipeIndex].rating = Math.round(avgRating * 10) / 10
        recipes[recipeIndex].review_count = recipeRatings.length
        recipes[recipeIndex].updated_at = new Date().toISOString()
        localStorage.setItem("db_recipes", JSON.stringify(recipes))
      }
    }
  }
}

// Export singleton instance
export const recipeDB = new RecipeDatabase()
