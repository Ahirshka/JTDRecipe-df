"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, Clock, Star } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { RecipePreview } from "@/components/recipe-preview"

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

interface RecipeData {
  recentlyApproved: Recipe[]
  topRated: Recipe[]
  allRecipes: Recipe[]
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [recipes, setRecipes] = useState<RecipeData>({
    recentlyApproved: [],
    topRated: [],
    allRecipes: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      console.log("🔄 [HOMEPAGE] Fetching recipes...")

      const response = await fetch("/api/recipes", {
        credentials: "include",
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 [HOMEPAGE] API Response:", data)

      if (data.success) {
        setRecipes({
          recentlyApproved: data.recentlyApproved || [],
          topRated: data.topRated || [],
          allRecipes: data.allRecipes || [],
        })
        console.log("✅ [HOMEPAGE] Recipes loaded successfully")
      } else {
        setError(data.message || "Failed to load recipes")
        console.error("❌ [HOMEPAGE] API Error:", data.message)
      }
    } catch (error) {
      console.error("❌ [HOMEPAGE] Fetch error:", error)
      setError("Failed to load recipes")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Share Your Recipes</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Discover, create, and share amazing recipes with our community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/add-recipe">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Your Recipe
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                    Get Started
                  </Button>
                </Link>
              )}
              <Link href="/search">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-orange-600 bg-transparent"
                >
                  Browse Recipes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recipes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-2">Unable to Load Recipes</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchRecipes} variant="outline">
                  Try Again
                </Button>
                {user?.role === "admin" && (
                  <div className="mt-4">
                    <Link href="/test-homepage">
                      <Button variant="link" size="sm">
                        Debug (Admin)
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Recently Approved Recipes */}
            {recipes.recentlyApproved.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-bold">Recently Approved</h2>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    New
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recipes.recentlyApproved.map((recipe) => (
                    <RecipePreview key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </section>
            )}

            {/* Top Rated Recipes */}
            {recipes.topRated.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-2xl font-bold">Top Rated</h2>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    Popular
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recipes.topRated.map((recipe) => (
                    <RecipePreview key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </section>
            )}

            {/* All Recipes */}
            {recipes.allRecipes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold">All Recipes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recipes.allRecipes.map((recipe) => (
                    <RecipePreview key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              </section>
            )}

            {/* No Recipes State */}
            {recipes.allRecipes.length === 0 &&
              recipes.recentlyApproved.length === 0 &&
              recipes.topRated.length === 0 && (
                <div className="text-center py-12">
                  <Card className="max-w-md mx-auto">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">No Recipes Yet</h3>
                      <p className="text-gray-600 mb-4">Be the first to share a recipe with our community!</p>
                      {isAuthenticated ? (
                        <Link href="/add-recipe">
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Recipe
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/signup">
                          <Button>Get Started</Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}
