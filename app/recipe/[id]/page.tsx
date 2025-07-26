"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, ChefHat, Eye, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import StarRating from "@/components/star-rating"

interface Recipe {
  id: string
  title: string
  description: string
  author_id: string
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url: string
  ingredients: string[]
  instructions: string[]
  tags: string[]
  rating: number
  review_count: number
  view_count: number
  created_at: string
  updated_at: string
}

export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (params.id) {
      fetchRecipe(params.id as string)
    }
  }, [params.id])

  const fetchRecipe = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${id}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setRecipe(data.recipe)
      } else {
        setError(data.message || "Recipe not found")
      }
    } catch (error) {
      console.error("Error fetching recipe:", error)
      setError("Failed to load recipe")
    } finally {
      setLoading(false)
    }
  }

  const handleRatingUpdate = (newRating: number, newReviewCount: number) => {
    if (recipe) {
      setRecipe({
        ...recipe,
        rating: newRating,
        review_count: newReviewCount,
      })
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      appetizer: "bg-green-100 text-green-800",
      "main-course": "bg-blue-100 text-blue-800",
      dessert: "bg-pink-100 text-pink-800",
      beverage: "bg-purple-100 text-purple-800",
      snack: "bg-yellow-100 text-yellow-800",
      breakfast: "bg-orange-100 text-orange-800",
      lunch: "bg-teal-100 text-teal-800",
      dinner: "bg-red-100 text-red-800",
    }
    return colors[category.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    }
    return colors[difficulty.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Recipe Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Recipe Header */}
        <Card className="mb-6">
          <div className="relative">
            <div className="aspect-video relative overflow-hidden rounded-t-lg">
              <Image
                src={recipe.image_url || "/placeholder.svg?height=400&width=800"}
                alt={recipe.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge className={`${getCategoryColor(recipe.category)} font-medium`}>
                {recipe.category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
              <Badge className={`${getDifficultyColor(recipe.difficulty)} font-medium`}>
                {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
              </Badge>
            </div>

            {/* View Count */}
            {recipe.view_count > 0 && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md flex items-center gap-1 text-sm">
                <Eye className="w-4 h-4" />
                <span>{recipe.view_count} views</span>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
                <p className="text-gray-600 mb-4">{recipe.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>
                    by <span className="font-medium text-gray-700">{recipe.author_username}</span>
                  </span>
                  <span>•</span>
                  <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>

                {/* Recipe Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  {recipe.prep_time_minutes > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Prep: {recipe.prep_time_minutes}m</span>
                    </div>
                  )}

                  {recipe.cook_time_minutes > 0 && (
                    <div className="flex items-center gap-1">
                      <ChefHat className="w-4 h-4 text-gray-400" />
                      <span>Cook: {recipe.cook_time_minutes}m</span>
                    </div>
                  )}

                  {totalTime > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>Total: {totalTime}m</span>
                    </div>
                  )}

                  {recipe.servings > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>
                        {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Star Rating */}
              <div className="lg:ml-6">
                <StarRating
                  recipeId={recipe.id}
                  currentRating={recipe.rating}
                  reviewCount={recipe.review_count}
                  onRatingUpdate={handleRatingUpdate}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ingredients */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm">{ingredient}</span>
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
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed pt-1">{instruction}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
