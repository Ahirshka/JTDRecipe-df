"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Star, Clock, Users, ChefHat, Eye, ArrowLeft, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
  image_url?: string
  rating: number
  review_count: number
  view_count: number
  ingredients: string[]
  instructions: string[]
  tags: string[]
  created_at: string
  updated_at: string
}

export default function RecipePage() {
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const recipeId = params.id as string
        console.log("🔄 [RECIPE-PAGE] Fetching recipe:", recipeId)

        const response = await fetch(`/api/recipes/${recipeId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch recipe")
        }

        if (!data.success) {
          throw new Error(data.error || "Recipe not found")
        }

        console.log("✅ [RECIPE-PAGE] Recipe loaded:", data.recipe.title)
        setRecipe(data.recipe)
      } catch (err) {
        console.error("❌ [RECIPE-PAGE] Error loading recipe:", err)
        setError(err instanceof Error ? err.message : "Failed to load recipe")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchRecipe()
    }
  }, [params.id])

  const handleShare = async () => {
    if (navigator.share && recipe) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Share cancelled or failed")
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // You could add a toast notification here
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Not Found</h1>
          <p className="text-gray-600 mb-6">{error || "The recipe you're looking for doesn't exist."}</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Recipe Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            <Image
              src={recipe.image_url || "/placeholder.svg?height=400&width=800"}
              alt={recipe.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="bg-white text-gray-900">
                    {recipe.category}
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-500 text-white">
                    {recipe.difficulty}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{recipe.title}</h1>
                <p className="text-lg opacity-90">by {recipe.author_username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recipe Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{totalTime}m</div>
              <div className="text-sm text-gray-600">Total Time</div>
              <div className="text-xs text-gray-500 mt-1">
                {recipe.prep_time_minutes}m prep + {recipe.cook_time_minutes}m cook
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{recipe.servings}</div>
              <div className="text-sm text-gray-600">Servings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold text-gray-900">{recipe.rating.toFixed(1)}</span>
              </div>
              <div className="text-sm text-gray-600">{recipe.review_count} reviews</div>
              <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" />
                {recipe.view_count} views
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {recipe.description && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-500" />
                  Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 leading-relaxed">{instruction}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recipe Meta */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                Recipe by <span className="font-medium text-gray-700">{recipe.author_username}</span>
              </div>
              <div>
                Added {new Date(recipe.created_at).toLocaleDateString()}
                {recipe.updated_at !== recipe.created_at && (
                  <span> • Updated {new Date(recipe.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
