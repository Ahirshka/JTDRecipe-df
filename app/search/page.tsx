"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, Filter, X, Clock, Star, Eye, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import Image from "next/image"
import { searchEngine, type SearchFilters, type SearchResult } from "@/lib/search"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || "all",
    difficulty: searchParams.get("difficulty") || "all",
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
    sortBy: (searchParams.get("sort") as any) || "relevance",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [popularTags, setPopularTags] = useState<{ name: string; count: number }[]>([])

  const performSearch = useCallback(
    async (newFilters: SearchFilters, page = 1) => {
      setLoading(true)
      try {
        const results = await searchEngine.searchRecipes(newFilters, page, 12)
        setSearchResults(results)
        setCurrentPage(page)

        // Update URL
        const params = new URLSearchParams()
        if (newFilters.query) params.set("q", newFilters.query)
        if (newFilters.category && newFilters.category !== "all") params.set("category", newFilters.category)
        if (newFilters.difficulty && newFilters.difficulty !== "all") params.set("difficulty", newFilters.difficulty)
        if (newFilters.tags && newFilters.tags.length > 0) params.set("tags", newFilters.tags.join(","))
        if (newFilters.sortBy && newFilters.sortBy !== "relevance") params.set("sort", newFilters.sortBy)

        router.push(`/search?${params.toString()}`, { scroll: false })
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    },
    [router],
  )

  useEffect(() => {
    performSearch(filters)

    // Load popular tags
    searchEngine.getPopularTags(15).then(setPopularTags)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(filters, 1)
  }

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    performSearch(newFilters, 1)
  }

  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag]
    updateFilter("tags", newTags)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: filters.query,
      sortBy: "relevance",
    }
    setFilters(clearedFilters)
    performSearch(clearedFilters, 1)
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h3 className="font-medium mb-3">Category</h3>
        <Select value={filters.category || "all"} onValueChange={(value) => updateFilter("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {searchResults?.filters.categories.map((category) => (
              <SelectItem key={category.name} value={category.name.toLowerCase()}>
                {category.name} ({category.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Difficulty Filter */}
      <div>
        <h3 className="font-medium mb-3">Difficulty</h3>
        <Select value={filters.difficulty || "all"} onValueChange={(value) => updateFilter("difficulty", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Difficulties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            {searchResults?.filters.difficulties.map((difficulty) => (
              <SelectItem key={difficulty.name} value={difficulty.name.toLowerCase()}>
                {difficulty.name} ({difficulty.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Popular Tags */}
      <div>
        <h3 className="font-medium mb-3">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {popularTags.map((tag) => (
            <Badge
              key={tag.name}
              variant={filters.tags?.includes(tag.name) ? "default" : "outline"}
              className="cursor-pointer hover:bg-orange-100"
              onClick={() => toggleTag(tag.name)}
            >
              {tag.name} ({tag.count})
            </Badge>
          ))}
        </div>
      </div>

      {/* Time Filters */}
      <div>
        <h3 className="font-medium mb-3">Max Prep Time</h3>
        <Slider
          value={[filters.maxPrepTime || 120]}
          onValueChange={([value]) => updateFilter("maxPrepTime", value === 120 ? undefined : value)}
          max={120}
          min={5}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>5 min</span>
          <span>{filters.maxPrepTime || 120} min</span>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Max Cook Time</h3>
        <Slider
          value={[filters.maxCookTime || 180]}
          onValueChange={([value]) => updateFilter("maxCookTime", value === 180 ? undefined : value)}
          max={180}
          min={5}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>5 min</span>
          <span>{filters.maxCookTime || 180} min</span>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h3 className="font-medium mb-3">Minimum Rating</h3>
        <Select
          value={filters.minRating?.toString() || "all"}
          onValueChange={(value) => updateFilter("minRating", value === "all" ? undefined : Number.parseFloat(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Rating</SelectItem>
            <SelectItem value="4">4+ Stars</SelectItem>
            <SelectItem value="3">3+ Stars</SelectItem>
            <SelectItem value="2">2+ Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" onClick={clearFilters} className="w-full">
        Clear All Filters
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-orange-600">
              JTDRecipe
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search recipes, ingredients, or tags..."
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>

          {/* Active Filters */}
          {filters.tags && filters.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => toggleTag(tag)} />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Filters</h2>
                  <Filter className="w-4 h-4" />
                </div>
                <FilterContent />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">
                  {filters.query ? `Search results for "${filters.query}"` : "All Recipes"}
                </h1>
                {searchResults && (
                  <span className="text-gray-500">
                    {searchResults.totalCount} recipe{searchResults.totalCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter("sortBy", value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="quickest">Quickest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded mb-4 w-2/3" />
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-16" />
                        <div className="h-3 bg-gray-200 rounded w-12" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults && searchResults.recipes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.recipes.map((recipe) => (
                  <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="relative">
                        <Image
                          src={recipe.image_url || "/placeholder.svg?height=200&width=300"}
                          alt={recipe.title}
                          width={300}
                          height={200}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <Badge className="absolute top-2 right-2 bg-white text-gray-900">{recipe.category}</Badge>
                        <Badge className="absolute top-2 left-2 bg-orange-600">{recipe.difficulty}</Badge>
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2 flex-1">{recipe.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {recipe.author_username}</p>

                        {recipe.tags && recipe.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {recipe.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {recipe.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{recipe.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
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
            ) : (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search terms or filters to find more recipes.</p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            )}

            {/* Pagination */}
            {searchResults && searchResults.totalCount > 12 && (
              <div className="flex justify-center mt-8">
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <Button variant="outline" onClick={() => performSearch(filters, currentPage - 1)}>
                      Previous
                    </Button>
                  )}

                  {Array.from({ length: Math.ceil(searchResults.totalCount / 12) })
                    .slice(Math.max(0, currentPage - 3), currentPage + 2)
                    .map((_, i) => {
                      const page = Math.max(0, currentPage - 3) + i + 1
                      return (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "outline"}
                          onClick={() => performSearch(filters, page)}
                        >
                          {page}
                        </Button>
                      )
                    })}

                  {currentPage < Math.ceil(searchResults.totalCount / 12) && (
                    <Button variant="outline" onClick={() => performSearch(filters, currentPage + 1)}>
                      Next
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
