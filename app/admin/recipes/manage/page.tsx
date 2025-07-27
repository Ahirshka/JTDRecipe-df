"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, ChefHat, Trash2, Eye, Edit, Star, Clock, Filter, ArrowLeft, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"

interface Recipe {
  id: string
  title: string
  description?: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  moderation_status: string
  is_published: boolean
  created_at: string
  updated_at: string
  author_id: string
  author_username: string
  author_email: string
  average_rating: number
  rating_count: number
}

interface Pagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export default function RecipeManagePage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState("")

  // Check permissions
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (!["admin", "owner", "moderator"].includes(user.role)) {
      router.push("/")
      return
    }
  }, [isAuthenticated, user, router])

  // Load recipes
  useEffect(() => {
    loadRecipes()
  }, [searchTerm, statusFilter, categoryFilter, pagination.offset])

  const loadRecipes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })

      const response = await fetch(`/api/admin/recipes/manage?${params}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes || [])
        setPagination(data.pagination || pagination)
        setCategories(data.categories || [])
      } else {
        console.error("Failed to load recipes:", response.status)
        setMessage("Failed to load recipes")
      }
    } catch (error) {
      console.error("Error loading recipes:", error)
      setMessage("Error loading recipes")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setDeleteReason("")
    setMessage("")
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!selectedRecipe) return

    setProcessing(true)
    setMessage("")

    try {
      const response = await fetch("/api/admin/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          reason: deleteReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setDeleteDialogOpen(false)
        setSelectedRecipe(null)
        loadRecipes() // Reload the list
      } else {
        setMessage(data.error || "Failed to delete recipe")
      }
    } catch (error) {
      console.error("Delete failed:", error)
      setMessage("Delete failed - network error")
    } finally {
      setProcessing(false)
    }
  }

  const getModerationBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyBadgeColor = (difficulty: string) => {
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

  if (!isAuthenticated || !user || !["admin", "owner", "moderator"].includes(user.role)) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/admin")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Recipe Management</h1>
          <p className="text-gray-600">Manage all recipes in the system</p>
        </div>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.filter((r) => r.moderation_status === "approved").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recipes.filter((r) => r.moderation_status === "pending").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search recipes, authors, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recipe List */}
      <Card>
        <CardHeader>
          <CardTitle>Recipes ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of{" "}
            {pagination.total} recipes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-gray-600">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url || "/placeholder.svg"}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ChefHat className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-lg">{recipe.title}</h3>
                        <Badge className={getModerationBadgeColor(recipe.moderation_status)}>
                          {recipe.moderation_status}
                        </Badge>
                        {!recipe.is_published && <Badge variant="outline">Draft</Badge>}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        by {recipe.author_username} • {new Date(recipe.created_at).toLocaleDateString()}
                      </p>

                      {recipe.description && (
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{recipe.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{recipe.category}</Badge>
                        <Badge className={getDifficultyBadgeColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                        <Badge variant="outline">{recipe.prep_time_minutes + recipe.cook_time_minutes} min</Badge>
                        <Badge variant="outline">{recipe.servings} servings</Badge>
                        {recipe.rating_count > 0 && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {recipe.average_rating.toFixed(1)} ({recipe.rating_count})
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/recipe/${recipe.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Recipe
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/recipe/${recipe.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Recipe
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteRecipe(recipe)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Recipe
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={loading}
              >
                Load More Recipes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRecipe && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">{selectedRecipe.title}</span>
                </div>
                <p className="text-sm text-red-700">by {selectedRecipe.author_username}</p>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ This action cannot be undone. The recipe and all associated data will be permanently deleted.
                </p>
              </div>
            )}

            {message && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="deleteReason">Reason for deletion (optional)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deleting this recipe..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedRecipe(null)
                setDeleteReason("")
                setMessage("")
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeDelete} disabled={processing}>
              {processing ? "Deleting..." : "Delete Recipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
