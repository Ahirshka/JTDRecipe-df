"use client"

import type React from "react"

import { Star, Clock, Eye, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"
import { hasPermission } from "@/lib/auth"
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
}

const categories = [
  { name: "Recently Added", icon: Clock, count: 0, description: "Last 30 days", key: "recent" },
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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch recipes from API route
        const response = await fetch("/api/recipes")

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status}`)
          // Don't throw error, just use empty data
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
        const allRecipes = Array.isArray(data) ? data : data.recipes || []

        // Calculate date ranges
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        // Filter and sort recipes for different categories
        const recentlyAdded = allRecipes
          .filter((recipe: Recipe) => new Date(recipe.created_at) >= thirtyDaysAgo)
          .sort((a: Recipe, b: Recipe) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 12)

        const topRated = [...allRecipes].sort((a: Recipe, b: Recipe) => b.rating - a.rating).slice(0, 12)

        const mostViewed = [...allRecipes].sort((a: Recipe, b: Recipe) => b.view_count - a.view_count).slice(0, 12)

        const trending = [...allRecipes]
          .sort((a: Recipe, b: Recipe) => {
            const aScore = a.view_count * 0.3 + a.rating * a.review_count * 0.7
            const bScore = b.view_count * 0.3 + b.rating * b.review_count * 0.7
            return bScore - aScore
          })
          .slice(0, 12)

        // Store all categories of recipes
        const categorizedRecipes = {
          recent: recentlyAdded,
          rated: topRated,
          viewed: mostViewed,
          trending: trending,
        }

        setAllFeaturedRecipes(categorizedRecipes)
        setDisplayedRecipes(recentlyAdded.slice(0, 6)) // Start with recently added

        // Update category counts
        setCategoryData([
          { ...categories[0], count: recentlyAdded.length },
          { ...categories[1], count: topRated.length },
          { ...categories[2], count: mostViewed.length },
          { ...categories[3], count: trending.length },
        ])
      } catch (error) {
        console.error("Error loading homepage data:", error)
        // Set empty data on error instead of crashing
        setAllFeaturedRecipes({
          recent: [],
          rated: [],
          viewed: [],
          trending: [],
        })
        setDisplayedRecipes([])
      } finally {
        setLoadingRecipes(false)
      }
    }

    loadData()
  }, [])

  const handleCategoryClick = async (categoryKey: string, categoryName: string) => {
    // Update active category
    setActiveCategory(categoryKey)

    // Update displayed recipes based on category
    const recipesToShow = allFeaturedRecipes[categoryKey as keyof typeof allFeaturedRecipes] || []
    setDisplayedRecipes(recipesToShow.slice(0, 6))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Categories</h2>
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
                <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative">
                      <Image
                        src={recipe.image_url || "/placeholder.svg?height=200&width=300"}
                        alt={recipe.title}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <Badge className="absolute top-2 right-2 bg-white text-gray-900">{recipe.category}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{recipe.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">by {recipe.author_username}</p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{recipe.rating.toFixed(1)}</span>
                          <span>({recipe.review_count})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{recipe.prep_time_minutes + recipe.cook_time_minutes}m</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{recipe.view_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {displayedRecipes.length === 0 && !loadingRecipes && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No approved recipes found in this category.</p>
              {hasPermission(user?.role || "user", "moderator") && (
                <p className="text-orange-600 mt-2">
                  <Link href="/admin" className="underline">
                    Check the admin panel for pending recipes
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
