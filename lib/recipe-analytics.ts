import { recipeDB, type DatabaseRecipe } from "./database"

export interface RecipeInteraction {
  id: string
  recipe_id: string
  user_id?: string
  interaction_type: "view" | "rating" | "favorite" | "share"
  created_at: string
}

export interface RecipeStats {
  recipe_id: string
  views_last_15_days: number
  ratings_last_60_days: number
  interactions_last_10_days: number
  avg_rating_last_60_days: number
  total_interactions: number
}

class RecipeAnalytics {
  // Track recipe interactions
  async trackInteraction(
    recipeId: string,
    interactionType: "view" | "rating" | "favorite" | "share",
    userId?: string,
  ): Promise<void> {
    const interactions = JSON.parse(localStorage.getItem("recipe_interactions") || "[]")

    const newInteraction: RecipeInteraction = {
      id: Date.now().toString(),
      recipe_id: recipeId,
      user_id: userId,
      interaction_type: interactionType,
      created_at: new Date().toISOString(),
    }

    interactions.push(newInteraction)
    localStorage.setItem("recipe_interactions", JSON.stringify(interactions))

    // Also update the recipe's view count if it's a view interaction
    if (interactionType === "view") {
      await recipeDB.updateRecipeViews(recipeId)
    }
  }

  // Get recently added recipes (last 30 days)
  async getRecentlyAddedRecipes(limit = 10): Promise<DatabaseRecipe[]> {
    const allRecipes = await recipeDB.getAllRecipes()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return allRecipes
      .filter((recipe) => {
        const recipeDate = new Date(recipe.created_at)
        return recipeDate >= thirtyDaysAgo && recipe.is_published
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  // Get top rated recipes in the last 60 days
  async getTopRatedRecipes(limit = 10): Promise<DatabaseRecipe[]> {
    const allRecipes = await recipeDB.getAllRecipes()
    const ratings = JSON.parse(localStorage.getItem("db_ratings") || "[]")
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // Calculate ratings for each recipe in the last 60 days
    const recipeRatings = new Map<string, { totalRating: number; count: number }>()

    ratings.forEach((rating: any) => {
      const ratingDate = new Date(rating.created_at)
      if (ratingDate >= sixtyDaysAgo) {
        const current = recipeRatings.get(rating.recipe_id) || { totalRating: 0, count: 0 }
        current.totalRating += rating.rating
        current.count += 1
        recipeRatings.set(rating.recipe_id, current)
      }
    })

    return allRecipes
      .filter((recipe) => recipe.is_published)
      .map((recipe) => {
        const ratingData = recipeRatings.get(recipe.id)
        const avgRating = ratingData ? ratingData.totalRating / ratingData.count : recipe.rating
        const ratingCount = ratingData ? ratingData.count : 0

        return {
          ...recipe,
          recent_rating: avgRating,
          recent_rating_count: ratingCount,
        }
      })
      .filter((recipe) => (recipe as any).recent_rating_count >= 3) // At least 3 ratings in 60 days
      .sort((a, b) => {
        // Sort by rating, then by number of ratings
        const ratingDiff = (b as any).recent_rating - (a as any).recent_rating
        if (Math.abs(ratingDiff) < 0.1) {
          return (b as any).recent_rating_count - (a as any).recent_rating_count
        }
        return ratingDiff
      })
      .slice(0, limit)
  }

  // Get most viewed recipes in the last 15 days
  async getMostViewedRecipes(limit = 10): Promise<DatabaseRecipe[]> {
    const allRecipes = await recipeDB.getAllRecipes()
    const interactions = JSON.parse(localStorage.getItem("recipe_interactions") || "[]")
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    // Count views for each recipe in the last 15 days
    const recipeViews = new Map<string, number>()

    interactions.forEach((interaction: RecipeInteraction) => {
      if (interaction.interaction_type === "view") {
        const interactionDate = new Date(interaction.created_at)
        if (interactionDate >= fifteenDaysAgo) {
          const currentViews = recipeViews.get(interaction.recipe_id) || 0
          recipeViews.set(interaction.recipe_id, currentViews + 1)
        }
      }
    })

    return allRecipes
      .filter((recipe) => recipe.is_published)
      .map((recipe) => ({
        ...recipe,
        recent_views: recipeViews.get(recipe.id) || 0,
      }))
      .filter((recipe) => (recipe as any).recent_views > 0)
      .sort((a, b) => (b as any).recent_views - (a as any).recent_views)
      .slice(0, limit)
  }

  // Get trending recipes (most interactions in last 10 days)
  async getTrendingRecipes(limit = 10): Promise<DatabaseRecipe[]> {
    const allRecipes = await recipeDB.getAllRecipes()
    const interactions = JSON.parse(localStorage.getItem("recipe_interactions") || "[]")
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    // Count all interactions for each recipe in the last 10 days
    const recipeInteractions = new Map<
      string,
      { total: number; views: number; ratings: number; favorites: number; shares: number }
    >()

    interactions.forEach((interaction: RecipeInteraction) => {
      const interactionDate = new Date(interaction.created_at)
      if (interactionDate >= tenDaysAgo) {
        const current = recipeInteractions.get(interaction.recipe_id) || {
          total: 0,
          views: 0,
          ratings: 0,
          favorites: 0,
          shares: 0,
        }

        current.total += 1
        current[(interaction.interaction_type + "s") as keyof typeof current] += 1
        recipeInteractions.set(interaction.recipe_id, current)
      }
    })

    return allRecipes
      .filter((recipe) => recipe.is_published)
      .map((recipe) => {
        const interactionData = recipeInteractions.get(recipe.id)
        return {
          ...recipe,
          trending_score: this.calculateTrendingScore(interactionData),
          recent_interactions: interactionData?.total || 0,
        }
      })
      .filter((recipe) => (recipe as any).recent_interactions > 0)
      .sort((a, b) => (b as any).trending_score - (a as any).trending_score)
      .slice(0, limit)
  }

  // Calculate trending score with weighted interactions
  private calculateTrendingScore(interactions?: {
    views: number
    ratings: number
    favorites: number
    shares: number
  }): number {
    if (!interactions) return 0

    // Weight different interactions differently
    const weights = {
      views: 1,
      ratings: 3,
      favorites: 2,
      shares: 4, // Shares are most valuable for trending
    }

    return (
      interactions.views * weights.views +
      interactions.ratings * weights.ratings +
      interactions.favorites * weights.favorites +
      interactions.shares * weights.shares
    )
  }

  // Get recipe statistics
  async getRecipeStats(recipeId: string): Promise<RecipeStats> {
    const interactions = JSON.parse(localStorage.getItem("recipe_interactions") || "[]")
    const ratings = JSON.parse(localStorage.getItem("db_ratings") || "[]")

    const now = new Date()
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)

    const recipeInteractions = interactions.filter((i: RecipeInteraction) => i.recipe_id === recipeId)
    const recipeRatings = ratings.filter((r: any) => r.recipe_id === recipeId)

    const views15Days = recipeInteractions.filter(
      (i: RecipeInteraction) => i.interaction_type === "view" && new Date(i.created_at) >= fifteenDaysAgo,
    ).length

    const ratings60Days = recipeRatings.filter((r: any) => new Date(r.created_at) >= sixtyDaysAgo)

    const interactions10Days = recipeInteractions.filter(
      (i: RecipeInteraction) => new Date(i.created_at) >= tenDaysAgo,
    ).length

    const avgRating60Days =
      ratings60Days.length > 0
        ? ratings60Days.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings60Days.length
        : 0

    return {
      recipe_id: recipeId,
      views_last_15_days: views15Days,
      ratings_last_60_days: ratings60Days.length,
      interactions_last_10_days: interactions10Days,
      avg_rating_last_60_days: avgRating60Days,
      total_interactions: recipeInteractions.length,
    }
  }

  // Initialize some sample interactions for demo purposes
  async initializeSampleInteractions(): Promise<void> {
    const existingInteractions = localStorage.getItem("recipe_interactions")
    if (existingInteractions) return // Already initialized

    const allRecipes = await recipeDB.getAllRecipes()
    const interactions: RecipeInteraction[] = []

    // Generate sample interactions for the last 30 days
    const now = new Date()

    allRecipes.forEach((recipe, index) => {
      // Generate views (most common interaction)
      for (let i = 0; i < 20 + Math.random() * 50; i++) {
        const daysAgo = Math.random() * 30
        const interactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

        interactions.push({
          id: `view_${recipe.id}_${i}`,
          recipe_id: recipe.id,
          user_id: `user${Math.floor(Math.random() * 10) + 1}`,
          interaction_type: "view",
          created_at: interactionDate.toISOString(),
        })
      }

      // Generate ratings (less common)
      for (let i = 0; i < 3 + Math.random() * 10; i++) {
        const daysAgo = Math.random() * 60
        const interactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

        interactions.push({
          id: `rating_${recipe.id}_${i}`,
          recipe_id: recipe.id,
          user_id: `user${Math.floor(Math.random() * 10) + 1}`,
          interaction_type: "rating",
          created_at: interactionDate.toISOString(),
        })
      }

      // Generate favorites
      for (let i = 0; i < Math.random() * 8; i++) {
        const daysAgo = Math.random() * 20
        const interactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

        interactions.push({
          id: `favorite_${recipe.id}_${i}`,
          recipe_id: recipe.id,
          user_id: `user${Math.floor(Math.random() * 10) + 1}`,
          interaction_type: "favorite",
          created_at: interactionDate.toISOString(),
        })
      }

      // Generate shares (least common but high value)
      for (let i = 0; i < Math.random() * 5; i++) {
        const daysAgo = Math.random() * 15
        const interactionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

        interactions.push({
          id: `share_${recipe.id}_${i}`,
          recipe_id: recipe.id,
          user_id: `user${Math.floor(Math.random() * 10) + 1}`,
          interaction_type: "share",
          created_at: interactionDate.toISOString(),
        })
      }
    })

    localStorage.setItem("recipe_interactions", JSON.stringify(interactions))
  }
}

export const recipeAnalytics = new RecipeAnalytics()
