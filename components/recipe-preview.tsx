"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, Users, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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
  approval_date?: string
  days_since_approval?: number
  is_recently_approved?: boolean
}

interface RecipePreviewProps {
  recipe: Recipe
  showApprovalBadge?: boolean
}

export function RecipePreview({ recipe, showApprovalBadge = false }: RecipePreviewProps) {
  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes

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
    switch (category.toLowerCase()) {
      case "appetizer":
        return "bg-blue-100 text-blue-800"
      case "main-course":
        return "bg-purple-100 text-purple-800"
      case "dessert":
        return "bg-pink-100 text-pink-800"
      case "beverage":
        return "bg-cyan-100 text-cyan-800"
      case "snack":
        return "bg-orange-100 text-orange-800"
      case "breakfast":
        return "bg-yellow-100 text-yellow-800"
      case "lunch":
        return "bg-green-100 text-green-800"
      case "dinner":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden">
        <div className="relative">
          <Image
            src={recipe.image_url || "/placeholder.svg?height=200&width=300"}
            alt={recipe.title}
            width={300}
            height={200}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className={getCategoryColor(recipe.category)} variant="secondary">
              {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1).replace("-", " ")}
            </Badge>
            {showApprovalBadge && recipe.is_recently_approved && (
              <Badge className="bg-green-500 text-white">Recently Approved</Badge>
            )}
          </div>

          <div className="absolute top-2 right-2">
            <Badge className={getDifficultyColor(recipe.difficulty)} variant="secondary">
              {recipe.difficulty}
            </Badge>
          </div>

          {/* Rating overlay */}
          {recipe.rating > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{recipe.rating.toFixed(1)}</span>
              <span className="text-xs">({recipe.review_count})</span>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {recipe.title}
          </h3>

          <p className="text-sm text-gray-600 mb-3">by {recipe.author_username}</p>

          {recipe.description && <p className="text-sm text-gray-700 mb-3 line-clamp-2">{recipe.description}</p>}

          {/* Recipe stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{totalTime}m</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{recipe.servings}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{recipe.view_count}</span>
            </div>
          </div>

          {/* Approval info for debugging */}
          {showApprovalBadge && recipe.days_since_approval !== undefined && (
            <div className="mt-2 text-xs text-gray-400">Approved {recipe.days_since_approval} days ago</div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
