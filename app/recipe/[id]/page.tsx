"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, ChefHat, Star, ArrowLeft, Edit, Heart, Share2, Bookmark } from "lucide-react"
import { StarRating } from "@/components/star-rating"
import { RecipeQuickActions } from "@/components/recipe-quick-actions"
import { useAuth } from "@/contexts/auth-context"

interface Recipe {
  id: string
  title: string
  description?: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  ingredients: string[]
  instructions: string[]
  image_url?: string
  moderation_status: string
  is_published: boolean
  created_at: string
  updated_at: string
  author_id: string
  author_username: string
  average_rating: number
  rating_count: number
  user_rating?: number
}

export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const recipeId = params.id as string

  useEffect(() => {
    if (recipeId) {
      loadRecipe()
    }
  }, [recipeId])

  const loadRecipe = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecipe(data.recipe)
        } else {
          setError(data.error || "Recipe not found")
        }
      } else if (response.status === 404) {
        setError("Recipe not found")
      } else {
        setError("Failed to load recipe")
      }
    } catch (error) {
      console.error("Error loading recipe:", error)
      setError("Failed to load recipe")
    } finally {
      setLoading(false)
    }
  }

  const handleRatingUpdate = (newRating: number, newAverage: number, newCount: number) => {
    if (recipe) {
      setRecipe({
        ...recipe,
        user_rating: newRating,
        average_rating: newAverage,
        rating_count: newCount,
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600">Loading recipe...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Recipe Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "The recipe you're looking for doesn't exist."}</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const isAuthor = isAuthenticated && user && user.id === recipe.author_id
  const canModerate = isAuthenticated && user && ["admin", "owner", "moderator"].includes(user.role)

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Recipes
        </Button>

        <div className="flex items-center gap-2">
          {(isAuthor || canModerate) && (
            <>
              {isAuthor && (
                <Button variant="outline" onClick={() => router.push(`/recipe/${recipe.id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Recipe
                </Button>
              )}
              <RecipeQuickActions
                recipe={{
                  id: recipe.id,
                  title: recipe.title,
                  author_username: recipe.author_username,
                  author_id: recipe.author_id,
                }}
                onRecipeDeleted={() => router.push("/")}
              />
            </>
          )}
        </div>
      </div>

      {/* Recipe Header */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recipe Image */}
            <div className="lg:col-span-1">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url || "/placeholder.svg"}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Recipe Info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-3xl font-bold">{recipe.title}</h1>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bookmark className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  by {recipe.author_username} • {new Date(recipe.created_at).toLocaleDateString()}
                </p>

                {recipe.description && <p className="text-gray-700 mb-4">{recipe.description}</p>}

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{recipe.category}</Badge>
                  <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                </div>
              </div>

              {/* Recipe Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm font-medium">Prep Time</div>
                  <div className="text-lg font-bold">{recipe.prep_time_minutes}m</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm font-medium">Cook Time</div>
                  <div className="text-lg font-bold">{recipe.cook_time_minutes}m</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm font-medium">Servings</div>
                  <div className="text-lg font-bold">{recipe.servings}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="text-sm font-medium">Rating</div>
                  <div className="text-lg font-bold">
                    {recipe.rating_count > 0 ? recipe.average_rating.toFixed(1) : "—"}
                  </div>
                </div>
              </div>

              {/* Rating Component */}
              <div className="pt-4">
                <StarRating
                  recipeId={recipe.id}
                  currentRating={recipe.average_rating}
                  totalReviews={recipe.rating_count}
                  userRating={recipe.user_rating}
                  onRatingUpdate={handleRatingUpdate}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <p className="pt-1">{instruction}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
