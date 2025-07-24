import { recipeDB, type DatabaseRecipe } from "./database"

export interface SearchFilters {
  query?: string
  category?: string
  difficulty?: string
  tags?: string[]
  maxPrepTime?: number
  maxCookTime?: number
  minRating?: number
  sortBy?: "relevance" | "rating" | "newest" | "popular" | "quickest"
}

export interface SearchResult {
  recipes: DatabaseRecipe[]
  totalCount: number
  filters: {
    categories: { name: string; count: number }[]
    difficulties: { name: string; count: number }[]
    tags: { name: string; count: number }[]
  }
}

export class RecipeSearchEngine {
  async searchRecipes(filters: SearchFilters, page = 1, limit = 12): Promise<SearchResult> {
    const allRecipes = await recipeDB.getAllRecipes()
    let filteredRecipes = allRecipes.filter((recipe) => recipe.is_published)

    // Text search in title, description, and tags
    if (filters.query) {
      const query = filters.query.toLowerCase()
      filteredRecipes = filteredRecipes.filter((recipe) => {
        const searchableText = [
          recipe.title,
          recipe.description || "",
          recipe.author_username || "",
          ...(recipe.tags || []),
          ...(recipe.ingredients || []),
        ]
          .join(" ")
          .toLowerCase()

        return searchableText.includes(query)
      })
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      filteredRecipes = filteredRecipes.filter(
        (recipe) => recipe.category.toLowerCase() === filters.category!.toLowerCase(),
      )
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== "all") {
      filteredRecipes = filteredRecipes.filter(
        (recipe) => recipe.difficulty.toLowerCase() === filters.difficulty!.toLowerCase(),
      )
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filteredRecipes = filteredRecipes.filter((recipe) => {
        const recipeTags = recipe.tags || []
        return filters.tags!.some((tag) =>
          recipeTags.some((recipeTag) => recipeTag.toLowerCase().includes(tag.toLowerCase())),
        )
      })
    }

    // Time filters
    if (filters.maxPrepTime) {
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.prep_time_minutes <= filters.maxPrepTime!)
    }

    if (filters.maxCookTime) {
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.cook_time_minutes <= filters.maxCookTime!)
    }

    // Rating filter
    if (filters.minRating) {
      filteredRecipes = filteredRecipes.filter((recipe) => recipe.rating >= filters.minRating!)
    }

    // Sorting
    filteredRecipes = this.sortRecipes(filteredRecipes, filters.sortBy || "relevance", filters.query)

    // Generate filter options from all recipes
    const filterOptions = this.generateFilterOptions(allRecipes)

    // Pagination
    const startIndex = (page - 1) * limit
    const paginatedRecipes = filteredRecipes.slice(startIndex, startIndex + limit)

    return {
      recipes: paginatedRecipes,
      totalCount: filteredRecipes.length,
      filters: filterOptions,
    }
  }

  private sortRecipes(recipes: DatabaseRecipe[], sortBy: string, query?: string): DatabaseRecipe[] {
    switch (sortBy) {
      case "rating":
        return recipes.sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating
          return b.review_count - a.review_count
        })

      case "newest":
        return recipes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      case "popular":
        return recipes.sort((a, b) => b.view_count - a.view_count)

      case "quickest":
        return recipes.sort(
          (a, b) => a.prep_time_minutes + a.cook_time_minutes - (b.prep_time_minutes + b.cook_time_minutes),
        )

      case "relevance":
      default:
        if (query) {
          return recipes.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(a, query)
            const bScore = this.calculateRelevanceScore(b, query)
            return bScore - aScore
          })
        }
        return recipes.sort((a, b) => b.rating - a.rating)
    }
  }

  private calculateRelevanceScore(recipe: DatabaseRecipe, query: string): number {
    const queryLower = query.toLowerCase()
    let score = 0

    // Title match (highest weight)
    if (recipe.title.toLowerCase().includes(queryLower)) {
      score += 10
      if (recipe.title.toLowerCase().startsWith(queryLower)) {
        score += 5
      }
    }

    // Category match
    if (recipe.category.toLowerCase().includes(queryLower)) {
      score += 8
    }

    // Tags match
    const tags = recipe.tags || []
    tags.forEach((tag) => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 6
      }
    })

    // Description match
    if (recipe.description?.toLowerCase().includes(queryLower)) {
      score += 3
    }

    // Ingredients match
    const ingredients = recipe.ingredients || []
    ingredients.forEach((ingredient) => {
      if (ingredient.toLowerCase().includes(queryLower)) {
        score += 2
      }
    })

    // Boost popular recipes slightly
    score += Math.min(recipe.rating, 5) * 0.5
    score += Math.min(recipe.view_count / 100, 2)

    return score
  }

  private generateFilterOptions(recipes: DatabaseRecipe[]) {
    const categories = new Map<string, number>()
    const difficulties = new Map<string, number>()
    const tags = new Map<string, number>()

    recipes.forEach((recipe) => {
      if (!recipe.is_published) return

      // Count categories
      categories.set(recipe.category, (categories.get(recipe.category) || 0) + 1)

      // Count difficulties
      difficulties.set(recipe.difficulty, (difficulties.get(recipe.difficulty) || 0) + 1)

      // Count tags
      recipe.tags?.forEach((tag) => {
        tags.set(tag, (tags.get(tag) || 0) + 1)
      })
    })

    return {
      categories: Array.from(categories.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),

      difficulties: Array.from(difficulties.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => {
          const order = ["Easy", "Medium", "Hard"]
          return order.indexOf(a.name) - order.indexOf(b.name)
        }),

      tags: Array.from(tags.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20), // Top 20 tags
    }
  }

  async getPopularTags(limit = 10): Promise<{ name: string; count: number }[]> {
    const allRecipes = await recipeDB.getAllRecipes()
    const tagCounts = new Map<string, number>()

    allRecipes.forEach((recipe) => {
      if (!recipe.is_published) return
      recipe.tags?.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  async getSuggestedSearches(): Promise<string[]> {
    return [
      "chocolate chip cookies",
      "chicken dinner",
      "vegetarian pasta",
      "quick breakfast",
      "healthy salad",
      "comfort food",
      "dessert recipes",
      "one pot meals",
      "grilled chicken",
      "fresh herbs",
    ]
  }
}

export const searchEngine = new RecipeSearchEngine()
