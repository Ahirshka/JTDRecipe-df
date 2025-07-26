"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, Plus, ChefHat, Settings } from "lucide-react"
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

export default function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all-categories")
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const categories = ["appetizer", "main-course", "dessert", "beverage", "snack", "breakfast", "lunch", "dinner"]

  const fetchRecipes = async () => {
    try {
      console.log("🔄 [HOMEPAGE] Fetching recipes...")
      setIsLoading(true)
      setError("")

      const params = new URLSearchParams()
      if (searchTerm) params.append("search", searchTerm)
      if (selectedCategory !== "all-categories") params.append("category", selectedCategory)
      params.append("limit", "50")

      const url = `/api/recipes?${params.toString()}`
      console.log("🔍 [HOMEPAGE] Fetching from:", url)

      const response = await fetch(url, {
        credentials: "include",
      })

      const data = await response.json()
      console.log("📊 [HOMEPAGE] API Response:", data)

      if (data.success) {
        setRecipes(data.recipes || [])
        setDebugInfo(data.debug || null)
        console.log(`✅ [HOMEPAGE] Loaded ${data.recipes?.length || 0} recipes`)
      } else {
        setError(data.error || "Failed to load recipes")
        console.error("❌ [HOMEPAGE] API Error:", data.error)
        console.error("❌ [HOMEPAGE] API Details:", data.details)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load recipes"
      setError(errorMessage)
      console.error("❌ [HOMEPAGE] Fetch Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
  }, [searchTerm, selectedCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRecipes()
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all-categories")
  }

  // Categorize recipes
  const recentlyApproved = recipes.filter((recipe) => recipe.is_recently_approved)
  const allRecipes = recipes

  console.log("📊 [HOMEPAGE] Recipe categorization:", {
    total: allRecipes.length,
    recently_approved: recentlyApproved.length,
    recipes_with_approval_data: recipes.filter((r) => r.approval_date).length,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Share Your Culinary Creations</h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              Discover amazing recipes from our community of home chefs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button
                  onClick={() => router.push("/add-recipe")}
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Share Your Recipe
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/login")}
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  <ChefHat className="mr-2 h-5 w-5" />
                  Join Our Community
                </Button>
              )}
              <Button
                onClick={() => router.push("/search")}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-orange-600"
              >
                <Search className="mr-2 h-5 w-5" />
                Explore Recipes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-categories">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
              {(searchTerm || selectedCategory !== "all-categories") && (
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Debug Info for Admins */}
        {(user?.role === "admin" || user?.role === "owner") && (
          <div className="mb-6 flex gap-4">
            <Button onClick={() => router.push("/test-homepage")} variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Debug Homepage
            </Button>
            {debugInfo && (
              <Badge variant="secondary">
                API: {debugInfo.total_found || 0} recipes, {debugInfo.recently_approved_count || 0} recent
              </Badge>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>
              {error}
              {(user?.role === "admin" || user?.role === "owner") && (
                <div className="mt-2">
                  <Button onClick={() => router.push("/test-homepage")} variant="outline" size="sm">
                    Debug This Issue
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-lg">Loading delicious recipes...</span>
            </div>
          </div>
        )}

        {/* Recently Added Section */}
        {!isLoading && recentlyApproved.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Recently Added</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {recentlyApproved.length} new recipes
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentlyApproved.slice(0, 8).map((recipe) => (
                <RecipePreview key={recipe.id} recipe={recipe} showApprovalBadge={true} />
              ))}
            </div>
          </div>
        )}

        {/* All Recipes Section */}
        {!isLoading && allRecipes.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchTerm || selectedCategory !== "all-categories" ? "Search Results" : "All Recipes"}
              </h2>
              <Badge variant="outline">{allRecipes.length} recipes</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allRecipes.map((recipe) => (
                <RecipePreview key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </div>
        )}

        {/* No Recipes State */}
        {!isLoading && allRecipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedCategory !== "all-categories" ? "No recipes found" : "No recipes available"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory !== "all-categories"
                ? "Try adjusting your search terms or filters"
                : "Be the first to share a delicious recipe with our community!"}
            </p>
            <div className="flex justify-center gap-4">
              {isAuthenticated && (
                <Button onClick={() => router.push("/add-recipe")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your Recipe
                </Button>
              )}
              {(user?.role === "admin" || user?.role === "owner") && (
                <Button onClick={() => router.push("/test-homepage")} variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Debug Homepage
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
