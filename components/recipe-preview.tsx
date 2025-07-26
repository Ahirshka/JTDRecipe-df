"use client"

import { Star, Clock, Eye, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  days_since_approval?: number
  is_recently_approved?: boolean
}

interface RecipePreviewProps {
  recipe: Recipe
  showApprovalBadge?: boolean
}

export function RecipePreview({ recipe, showApprovalBadge = false }: RecipePreviewProps) {
  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <div className="relative">
          <Image
            src={recipe.image_url || "/placeholder.svg?height=200&width=300"}
            alt={recipe.title}
            width={300}
            height={200}
            className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-200"
          />

          {/* Category Badge */}
          <Badge className="absolute top-2 right-2 bg-white text-gray-900 shadow-sm">{recipe.category}</Badge>

          {/* Recently Approved Badge */}
          {showApprovalBadge && recipe.is_recently_approved && (
            <Badge className="absolute top-2 left-2 bg-green-500 text-white shadow-sm">Recently Approved</Badge>
          )}

          {/* Difficulty Badge */}
          <Badge
            className={`absolute bottom-2 left-2 shadow-sm ${
              recipe.difficulty === "Easy"
                ? "bg-green-500"
                : recipe.difficulty === "Medium"
                  ? "bg-yellow-500"
                  : "bg-red-500"
            } text-white`}
          >
            {recipe.difficulty}
          </Badge>
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {recipe.title}
          </h3>

          {/* Author */}
          <p className="text-sm text-gray-600 mb-3">by {recipe.author_username}</p>

          {/* Description Preview */}
          {recipe.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{recipe.description}</p>}

          {/* Approval Info */}
          {showApprovalBadge && recipe.days_since_approval !== undefined && (
            <p className="text-xs text-green-600 mb-3 font-medium">Approved {recipe.days_since_approval} days ago</p>
          )}

          {/* Recipe Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{Number(recipe.rating).toFixed(1)}</span>
              <span>({recipe.review_count})</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{recipe.view_count}</span>
            </div>
          </div>

          {/* Time and Servings */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 w-4" />
              <span>{totalTime}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
