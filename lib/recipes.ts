export interface Recipe {
  id: string
  title: string
  author: string
  authorId?: string
  rating: number
  reviews: number
  cookTime: string
  prepTime: string
  servings: number
  difficulty: string
  views: number
  image: string
  category: string
  description: string
  ingredients: string[]
  instructions: string[]
  tags: string[]
  dateAdded: string
}

// Mock recipe data - in production this would come from a database
export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Perfect Chocolate Chip Cookies",
    author: "BakingMaster",
    authorId: "user1",
    rating: 4.9,
    reviews: 234,
    cookTime: "25 min",
    prepTime: "15 min",
    servings: 24,
    difficulty: "Easy",
    views: 1250,
    image: "/placeholder.svg?height=400&width=600",
    category: "Desserts",
    description:
      "These are the most perfect chocolate chip cookies you'll ever make. Crispy edges, chewy centers, and loaded with chocolate chips.",
    ingredients: [
      "2¼ cups all-purpose flour",
      "1 tsp baking soda",
      "1 tsp salt",
      "1 cup butter, softened",
      "¾ cup granulated sugar",
      "¾ cup packed brown sugar",
      "2 large eggs",
      "2 tsp vanilla extract",
      "2 cups chocolate chips",
    ],
    instructions: [
      "Preheat oven to 375°F (190°C).",
      "In a medium bowl, whisk together flour, baking soda, and salt.",
      "In a large bowl, cream together butter and both sugars until light and fluffy.",
      "Beat in eggs one at a time, then stir in vanilla.",
      "Gradually blend in flour mixture.",
      "Stir in chocolate chips.",
      "Drop rounded tablespoons of dough onto ungreased cookie sheets.",
      "Bake for 9-11 minutes or until golden brown.",
      "Cool on baking sheet for 2 minutes; remove to wire rack.",
    ],
    tags: ["cookies", "dessert", "chocolate", "baking", "easy"],
    dateAdded: "2024-01-15",
  },
  {
    id: "2",
    title: "One-Pot Chicken Alfredo",
    author: "QuickCook",
    authorId: "user2",
    rating: 4.8,
    reviews: 189,
    cookTime: "30 min",
    prepTime: "10 min",
    servings: 4,
    difficulty: "Medium",
    views: 980,
    image: "/placeholder.svg?height=400&width=600",
    category: "Main Dishes",
    description: "Creamy, delicious chicken alfredo made in just one pot for easy cleanup.",
    ingredients: [
      "1 lb chicken breast, cubed",
      "12 oz fettuccine pasta",
      "2 cups heavy cream",
      "1 cup parmesan cheese",
      "3 cloves garlic, minced",
      "2 tbsp olive oil",
      "Salt and pepper to taste",
      "Fresh parsley for garnish",
    ],
    instructions: [
      "Heat olive oil in a large pot over medium-high heat.",
      "Add chicken and cook until golden brown.",
      "Add garlic and cook for 1 minute.",
      "Add pasta, cream, and 2 cups water.",
      "Bring to a boil, then reduce heat and simmer for 15 minutes.",
      "Stir in parmesan cheese until melted.",
      "Season with salt and pepper.",
      "Garnish with fresh parsley and serve.",
    ],
    tags: ["chicken", "pasta", "one-pot", "dinner", "creamy"],
    dateAdded: "2024-01-10",
  },
  {
    id: "3",
    title: "Fresh Garden Salad",
    author: "HealthyEats",
    authorId: "user3",
    rating: 4.7,
    reviews: 156,
    cookTime: "10 min",
    prepTime: "10 min",
    servings: 4,
    difficulty: "Easy",
    views: 750,
    image: "/placeholder.svg?height=400&width=600",
    category: "Salads",
    description: "A refreshing garden salad with crisp vegetables and homemade vinaigrette.",
    ingredients: [
      "6 cups mixed greens",
      "1 cucumber, sliced",
      "2 tomatoes, chopped",
      "1 red onion, thinly sliced",
      "1 bell pepper, chopped",
      "¼ cup olive oil",
      "2 tbsp balsamic vinegar",
      "1 tsp Dijon mustard",
      "Salt and pepper to taste",
    ],
    instructions: [
      "Wash and dry all vegetables.",
      "Combine greens, cucumber, tomatoes, onion, and bell pepper in a large bowl.",
      "In a small bowl, whisk together olive oil, balsamic vinegar, and Dijon mustard.",
      "Season dressing with salt and pepper.",
      "Drizzle dressing over salad just before serving.",
      "Toss gently and serve immediately.",
    ],
    tags: ["salad", "healthy", "vegetarian", "fresh", "quick"],
    dateAdded: "2024-01-05",
  },
]

// Get all recipes from localStorage, including user-created ones
const getAllStoredRecipes = (): Recipe[] => {
  if (typeof window === "undefined") return mockRecipes
  const storedRecipes = localStorage.getItem("user_recipes")
  const userRecipes = storedRecipes ? JSON.parse(storedRecipes) : []
  return [...mockRecipes, ...userRecipes]
}

// Save a new recipe to localStorage
export const saveRecipe = (recipeData: Omit<Recipe, "id" | "dateAdded" | "rating" | "reviews" | "views">): Recipe => {
  const newRecipe: Recipe = {
    ...recipeData,
    id: Date.now().toString(),
    dateAdded: new Date().toISOString(),
    rating: 0,
    reviews: 0,
    views: 0,
  }

  const storedRecipes = localStorage.getItem("user_recipes")
  const userRecipes = storedRecipes ? JSON.parse(storedRecipes) : []
  userRecipes.push(newRecipe)
  localStorage.setItem("user_recipes", JSON.stringify(userRecipes))

  return newRecipe
}

export const getRecipeById = (id: string): Recipe | null => {
  const allRecipes = getAllStoredRecipes()
  return allRecipes.find((recipe) => recipe.id === id) || null
}

export const getAllRecipes = (): Recipe[] => {
  return getAllStoredRecipes()
}

export const getRecipesByIds = (ids: string[]): Recipe[] => {
  const allRecipes = getAllStoredRecipes()
  return allRecipes.filter((recipe) => ids.includes(recipe.id))
}

export const getRecipesByAuthorId = (authorId: string): Recipe[] => {
  const allRecipes = getAllStoredRecipes()
  return allRecipes.filter((recipe) => recipe.authorId === authorId)
}

export const updateRecipeViews = (recipeId: string): void => {
  const recipe = getRecipeById(recipeId)
  if (!recipe) return

  // For mock recipes, we can't update them, but for user recipes we can
  const storedRecipes = localStorage.getItem("user_recipes")
  if (storedRecipes) {
    const userRecipes = JSON.parse(storedRecipes)
    const recipeIndex = userRecipes.findIndex((r: Recipe) => r.id === recipeId)
    if (recipeIndex !== -1) {
      userRecipes[recipeIndex].views += 1
      localStorage.setItem("user_recipes", JSON.stringify(userRecipes))
    }
  }
}
