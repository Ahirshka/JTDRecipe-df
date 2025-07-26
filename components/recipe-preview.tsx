"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Eye, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Recipe {
  id: string
  title: string
  description?: string
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
  created_at: string
  updated_at: string
}

interface RecipePreviewProps {
  recipe: Recipe
}

export function RecipePreview({ recipe }: RecipePreviewProps) {
  if (!recipe) {
    return null
  }

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

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
    return colors[category?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    }
    return colors[difficulty?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden">
        <div className="relative">
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={recipe.image_url || "/placeholder.svg?height=200&width=300"}
              alt={recipe.title || "Recipe"}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          {/* Category Badge - Top Left */}
          <Badge className={`absolute top-2 left-2 ${getCategoryColor(recipe.category)} font-medium`}>
            {recipe.category?.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Uncategorized"}
          </Badge>

          {/* Difficulty Badge - Top Right */}
          <Badge className={`absolute top-2 right-2 ${getDifficultyColor(recipe.difficulty)} font-medium`}>
            {recipe.difficulty?.charAt(0).toUpperCase() + recipe.difficulty?.slice(1) || "Unknown"}
          </Badge>

          {/* Rating Overlay - Bottom Left */}
          {recipe.rating > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md flex items-center gap-1 text-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{recipe.rating.toFixed(1)}</span>
              {recipe.review_count > 0 && <span className="text-gray-300">({recipe.review_count})</span>}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {recipe.title || "Untitled Recipe"}
          </h3>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description || "No description available"}</p>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span className="font-medium text-gray-700">by {recipe.author_username || "Unknown"}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              {totalTime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{totalTime}m</span>
                </div>
              )}

              {recipe.servings > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings}</span>
                </div>
              )}
            </div>

            {recipe.view_count > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{recipe.view_count}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default RecipePreview
