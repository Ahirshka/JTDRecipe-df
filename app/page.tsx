"use client"

import type React from "react"
import { Star, Clock, Eye, TrendingUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { RecipePreview } from "@/components/recipe-preview"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Recipe {
  id: string
  title: string
  description?: string
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
  moderation_status: string
  is_published: boolean
  created_at: string
  updated_at: string
  approval_date?: string
  days_since_approval?: number
  is_recently_approved?: boolean
}

const categories = [
  { name: "Recently Added", icon: Clock, count: 0, description: "Approved in last 30 days", key: "recent" },
  { name: "Top Rated", icon: Star, count: 0, description: "Best in 60 days", key: "rated" },
  { name: "Most Viewed", icon: Eye, count: 0, description: "Popular in 15 days", key: "viewed" },
  { name: "Trending", icon: TrendingUp, count: 0, description: "Hot in 10 days", key: "trending" },
]

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [allFeaturedRecipes, setAllFeaturedRecipes] = useState<{
    recent: Recipe[]
    rated: Recipe[]
    viewed: Recipe[]
    trending: Recipe[]
  }>({
    recent: [],
    rated: [],
    viewed: [],
    trending: [],
  })
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("recent")
  const [categoryData, setCategoryData] = useState(categories)
  const [loadingRecipes, setLoadingRecipes] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)

      console.log("🔄 [HOMEPAGE] Loading recipes from API...")
      const response = await fetch("/api/recipes?limit=50", {
        cache: "no-store", // Ensure fresh data
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("📡 [HOMEPAGE] Response status:", response.status)

      if (!response.ok) {
        console.error(`❌ [HOMEPAGE] HTTP error! status: ${response.status}`)
        const errorText = await response.text()
        console.error("❌ [HOMEPAGE] Error response:", errorText)
        setAllFeaturedRecipes({
          recent: [],
          rated: [],
          viewed: [],
          trending: [],
        })
        setDisplayedRecipes([])
        return
      }

      const data = await response.json()
      console.log("📋 [HOMEPAGE] API Response:", data)

      if (!data.success) {
        console.error("❌ [HOMEPAGE] API returned error:", data.error)
        setAllFeaturedRecipes({
          recent: [],
          rated: [],
          viewed: [],
          trending: [],
        })
        setDisplayedRecipes([])
        return
      }

      const allRecipes = Array.isArray(data.recipes) ? data.recipes : []
      console.log(`📋 [HOMEPAGE] Processing ${allRecipes.length} recipes`)

      // Log each recipe for debugging with approval timing
      allRecipes.forEach((recipe: any, index: number) => {
        console.log(`📋 [HOMEPAGE] Recipe ${index + 1}:`, {
          id: recipe.id,
          title: recipe.title,
          author: recipe.author_username,
          status: recipe.moderation_status,
          published: recipe.is_published,
          created: recipe.created_at,
          updated: recipe.updated_at,
          approval_date: recipe.approval_date,
          days_since_approval: recipe.days_since_approval,
          is_recently_approved: recipe.is_recently_approved,
        })
      })

      // Ensure all recipes have proper numeric values
      const processedRecipes = allRecipes.map((recipe: any) => ({
        ...recipe,
        rating: Number(recipe.rating) || 0,
        review_count: Number(recipe.review_count) || 0,
        view_count: Number(recipe.view_count) || 0,
        prep_time_minutes: Number(recipe.prep_time_minutes) || 0,
        cook_time_minutes: Number(recipe.cook_time_minutes) || 0,
        servings: Number(recipe.servings) || 1,
      }))

      // Filter recipes based on approval date for "Recently Added"
      // Only show recipes that were approved in the last 30 days
      const recentlyApproved = processedRecipes
        .filter((recipe: Recipe) => {
          const isRecentlyApproved = recipe.is_recently_approved === true
          const daysSince = recipe.days_since_approval || 999

          console.log(`🔍 [HOMEPAGE] Recipe "${recipe.title}":`, {
            daysSinceApproval: daysSince,
            isRecentlyApproved,
            qualifiesForRecentlyAdded: isRecentlyApproved && daysSince <= 30,
          })

          return isRecentlyApproved && daysSince <= 30
        })
        .sort((a: Recipe, b: Recipe) => {
          // Sort by approval date (updated_at) descending - most recently approved first
          const aApprovalDate = new Date(a.approval_date || a.updated_at)
          const bApprovalDate = new Date(b.approval_date || b.updated_at)
          return bApprovalDate.getTime() - aApprovalDate.getTime()
        })
        .slice(0, 12)

      console.log(`📊 [HOMEPAGE] Recently approved recipes (last 30 days): ${recentlyApproved.length}`)
      recentlyApproved.forEach((recipe, index) => {
        console.log(`  ${index + 1}. "${recipe.title}" - approved ${recipe.days_since_approval} days ago`)
      })

      // Other categories use different sorting
      const topRated = [...processedRecipes].sort((a: Recipe, b: Recipe) => b.rating - a.rating).slice(0, 12)

      const mostViewed = [...processedRecipes].sort((a: Recipe, b: Recipe) => b.view_count - a.view_count).slice(0, 12)

      const trending = [...processedRecipes]
        .sort((a: Recipe, b: Recipe) => {
          const aScore = a.view_count * 0.3 + a.rating * a.review_count * 0.7
          const bScore = b.view_count * 0.3 + b.rating * b.review_count * 0.7
          return bScore - aScore
        })
        .slice(0, 12)

      console.log("📊 [HOMEPAGE] Categorized recipes:", {
        recent: recentlyApproved.length,
        rated: topRated.length,
        viewed: mostViewed.length,
        trending: trending.length,
      })

      // Store all categories of recipes
      const categorizedRecipes = {
        recent: recentlyApproved,
        rated: topRated,
        viewed: mostViewed,
        trending: trending,
      }

      setAllFeaturedRecipes(categorizedRecipes)

      // Update displayed recipes based on active category
      const currentCategoryRecipes = categorizedRecipes[activeCategory as keyof typeof categorizedRecipes] || []
      setDisplayedRecipes(currentCategoryRecipes.slice(0, 6))

      // Update category counts
      setCategoryData([
        { ...categories[0], count: recentlyApproved.length },
        { ...categories[1], count: topRated.length },
        { ...categories[2], count: mostViewed.length },
        { ...categories[3], count: trending.length },
      ])

      console.log("✅ [HOMEPAGE] Homepage data loaded successfully")
    } catch (error) {
      console.error("❌ [HOMEPAGE] Error loading homepage data:", error)
      setAllFeaturedRecipes({
        recent: [],
        rated: [],
        viewed: [],
        trending: [],
      })
      setDisplayedRecipes([])
    } finally {
      setLoadingRecipes(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Update displayed recipes when active category changes
  useEffect(() => {
    const recipesToShow = allFeaturedRecipes[activeCategory as keyof typeof allFeaturedRecipes] || []
    setDisplayedRecipes(recipesToShow.slice(0, 6))
  }, [activeCategory, allFeaturedRecipes])

  const handleCategoryClick = async (categoryKey: string, categoryName: string) => {
    setActiveCategory(categoryKey)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleRefresh = () => {
    loadData(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Just the damn recipe.</h1>
          <p className="text-xl text-gray-600 mb-8">No life-stories, no fluff, just recipes that work.</p>
          {user && <p className="text-lg text-orange-600 mb-8">Welcome back, {user?.username}!</p>}

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <Input
              type="search"
              placeholder="Search for recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 pr-24 py-4 text-lg rounded-full border-2 border-gray-200 focus:border-orange-500"
            />
            <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6">
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryData.map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.key, category.name)}
                className="w-full"
              >
                <Card
                  className={`hover:shadow-md transition-all cursor-pointer ${
                    activeCategory === category.key ? "ring-2 ring-orange-500 bg-orange-50" : "hover:shadow-md"
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    <category.icon
                      className={`w-8 h-8 mx-auto mb-2 ${
                        activeCategory === category.key ? "text-orange-600" : "text-orange-600"
                      }`}
                    />
                    <h3
                      className={`font-semibold ${
                        activeCategory === category.key ? "text-orange-900" : "text-gray-900"
                      }`}
                    >
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">{category.count} recipes</p>
                    <p className="text-xs text-gray-400 mt-1">{category.description}</p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {categoryData.find((cat) => cat.key === activeCategory)?.name || "Featured Recipes"}
              </h2>
              <p className="text-gray-600 mt-1">
                {categoryData.find((cat) => cat.key === activeCategory)?.description}
              </p>
            </div>
            <Link href="/search">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {loadingRecipes ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3 w-2/3"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRecipes.map((recipe) => (
                <RecipePreview key={recipe.id} recipe={recipe} showApprovalBadge={activeCategory === "recent"} />
              ))}
            </div>
          )}

          {displayedRecipes.length === 0 && !loadingRecipes && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {activeCategory === "recent"
                  ? "No recipes approved in the last 30 days."
                  : "No approved recipes found in this category."}
              </p>
              {user?.role === "owner" || user?.role === "admin" ? (
                <div className="mt-4 space-y-2">
                  <p className="text-orange-600">
                    <Link href="/admin" className="underline">
                      Check the admin panel for pending recipes
                    </Link>
                  </p>
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    Refresh to check for new recipes
                  </Button>
                </div>
              ) : (
                <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4 bg-transparent">
                  Refresh to check for new recipes
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
