"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Star, Eye, ChefHat } from "lucide-react"

interface Recipe {
  id: string
  title: string
  description: string
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url: string
  rating: number
  review_count: number
  view_count: number
  created_at: string
  updated_at: string
  approval_date: string
  days_since_approval: number
  is_recently_approved: boolean
}

interface RecipePreviewProps {
  recipe: Recipe
}

export function RecipePreview({ recipe }: RecipePreviewProps) {
  const router = useRouter()

  const handleClick = () => {
    console.log("🔄 [RECIPE-PREVIEW] Navigating to recipe:", recipe.id)
    router.push(`/recipe/${recipe.id}`)
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

  const getCategoryColor = (category: string) => {
    const colors = {
      appetizer: "bg-purple-100 text-purple-800",
      "main-course": "bg-blue-100 text-blue-800",
      dessert: "bg-pink-100 text-pink-800",
      beverage: "bg-cyan-100 text-cyan-800",
      snack: "bg-orange-100 text-orange-800",
      breakfast: "bg-yellow-100 text-yellow-800",
      lunch: "bg-green-100 text-green-800",
      dinner: "bg-indigo-100 text-indigo-800",
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
      onClick={handleClick}
    >
      {/* Recipe Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.image_url || "/placeholder.svg?height=200&width=300&text=Recipe+Image"}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/placeholder.svg?height=200&width=300&text=Recipe+Image"
          }}
        />

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {recipe.is_recently_approved && <Badge className="bg-green-500 text-white text-xs">Recently Approved</Badge>}
          <Badge className={`text-xs ${getDifficultyColor(recipe.difficulty)}`}>{recipe.difficulty}</Badge>
        </div>

        <div className="absolute top-2 right-2">
          <Badge className={`text-xs ${getCategoryColor(recipe.category)}`}>{recipe.category.replace("-", " ")}</Badge>
        </div>

        {/* Rating Overlay */}
        {recipe.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded text-xs">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span>{recipe.rating.toFixed(1)}</span>
            <span className="text-gray-300">({recipe.review_count})</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Recipe Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {recipe.title}
        </h3>

        {/* Recipe Description */}
        {recipe.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>}

        {/* Author */}
        <div className="flex items-center gap-1 mb-3 text-sm text-gray-600">
          <ChefHat className="w-4 h-4" />
          <span>by {recipe.author_username}</span>
        </div>

        {/* Recipe Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{totalTime}min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{recipe.view_count}</span>
          </div>
        </div>

        {/* Time Breakdown */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Prep: {recipe.prep_time_minutes}min</span>
            <span>Cook: {recipe.cook_time_minutes}min</span>
          </div>
        </div>

        {/* Recently Approved Info */}
        {recipe.is_recently_approved && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-green-600 font-medium">✨ Approved {recipe.days_since_approval} days ago</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
