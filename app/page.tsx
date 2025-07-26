"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, Clock, Star, AlertCircle } from "lucide-react"
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

interface ApiResponse {
  success: boolean
  recipes?: Recipe[]
  recentlyApproved?: Recipe[]
  topRated?: Recipe[]
  allRecipes?: Recipe[]
  count?: number
  debug?: any
  error?: string
  details?: string
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const [recipes, setRecipes] = useState<{
    recentlyApproved: Recipe[]
    topRated: Recipe[]
    allRecipes: Recipe[]
  }>({
    recentlyApproved: [],
    topRated: [],
    allRecipes: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    fetchRecipes()
  }, [])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("🔄 [HOMEPAGE] Fetching recipes...")

      const response = await fetch("/api/recipes", {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📊 [HOMEPAGE] Response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log("📊 [HOMEPAGE] API Response:", data)

      if (data.success) {
        // Handle both old and new API response formats
        const recentlyApproved = data.recentlyApproved || []
        const topRated = data.topRated || []
        const allRecipes = data.allRecipes || data.recipes || []

        setRecipes({
          recentlyApproved,
          topRated,
          allRecipes,
        })

        setDebugInfo(data.debug)

        console.log("✅ [HOMEPAGE] Recipes loaded successfully:", {
          recent: recentlyApproved.length,
          topRated: topRated.length,
          total: allRecipes.length,
        })
      } else {
        const errorMsg = data.error || "Failed to load recipes"
        setError(errorMsg)
        console.error("❌ [HOMEPAGE] API Error:", errorMsg)
        if (data.details) {
          console.error("❌ [HOMEPAGE] Error Details:", data.details)
        }
      }
    } catch (error) {
      console.error("❌ [HOMEPAGE] Fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to load recipes")
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
        {/* Debug Info for Admins */}
        {(user?.role === "admin" || user?.role === "owner") && debugInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Info (Admin Only)</h3>
            <div className="text-sm space-y-1">
              <p>Database approved count: {debugInfo.database_approved_count}</p>
              <p>API found: {debugInfo.total_found} recipes</p>
              <p>Recently approved: {debugInfo.recently_approved_count}</p>
              <p>Top rated: {debugInfo.top_rated_count}</p>
              <p>Timestamp: {debugInfo.timestamp}</p>
            </div>
            <Link href="/test-homepage">
              <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                Full Debug Analysis
              </Button>
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recipes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Unable to Load Recipes</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="space-y-2">
                  <Button onClick={fetchRecipes} variant="outline" className="w-full bg-transparent">
                    Try Again
                  </Button>
                  {(user?.role === "admin" || user?.role === "owner") && (
                    <Link href="/test-homepage">
                      <Button variant="link" size="sm" className="w-full">
                        Debug This Issue (Admin)
                      </Button>
                    </Link>
                  )}
                </div>
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
                    {recipes.recentlyApproved.length} New
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
                    {recipes.topRated.length} Popular
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
                  <Badge variant="outline">{recipes.allRecipes.length} Total</Badge>
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
                      <h3 className="text-lg font-semibold mb-2">No Approved Recipes Yet</h3>
                      <p className="text-gray-600 mb-4">
                        {user?.role === "admin" || user?.role === "owner"
                          ? "No recipes have been approved yet. Check the admin panel to approve pending recipes."
                          : "Be the first to share a recipe with our community!"}
                      </p>
                      <div className="space-y-2">
                        {isAuthenticated ? (
                          <Link href="/add-recipe">
                            <Button className="w-full">
                              <Plus className="w-4 h-4 mr-2" />
                              Add First Recipe
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/signup">
                            <Button className="w-full">Get Started</Button>
                          </Link>
                        )}
                        {(user?.role === "admin" || user?.role === "owner") && (
                          <Link href="/admin/recipes">
                            <Button variant="outline" className="w-full bg-transparent">
                              Approve Recipes (Admin)
                            </Button>
                          </Link>
                        )}
                      </div>
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
