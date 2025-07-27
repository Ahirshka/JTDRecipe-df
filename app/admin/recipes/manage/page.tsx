"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, ArrowLeft, Eye, Edit, Trash2, Clock, Users, Star, ChefHat, MoreVertical } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
  average_rating: number
  rating_count: number
  view_count: number
}

interface RecipeStats {
  total: number
  approved: number
  pending: number
  rejected: number
}

export default function ManageRecipesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [stats, setStats] = useState<RecipeStats>({ total: 0, approved: 0, pending: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [processing, setProcessing] = useState(false)

  // Check if user has admin permissions
  const canManage = isAuthenticated && user && ["admin", "owner", "moderator"].includes(user.role)

  useEffect(() => {
    if (!canManage) {
      router.push("/admin")
      return
    }
    loadRecipes()
  }, [canManage, search, statusFilter, categoryFilter])

  const loadRecipes = async () => {
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)

      const response = await fetch(`/api/admin/recipes/manage?${params}`, {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecipes(data.recipes)
          setStats(data.stats)
        } else {
          setError(data.error || "Failed to load recipes")
        }
      } else {
        setError("Failed to load recipes")
      }
    } catch (error) {
      console.error("Error loading recipes:", error)
      setError("Failed to load recipes")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setDeleteReason("")
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!selectedRecipe) return

    setProcessing(true)

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
        setDeleteReason("")
        loadRecipes() // Reload the list
      } else {
        setError(data.error || "Failed to delete recipe")
      }
    } catch (error) {
      console.error("Error deleting recipe:", error)
      setError("Failed to delete recipe")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
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

  if (!canManage) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => router.push("/admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Manage Recipes</h1>
        <div className="w-32" /> {/* Spacer for centering */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Recipes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search recipes by title, description, or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="appetizer">Appetizer</SelectItem>
                <SelectItem value="main-course">Main Course</SelectItem>
                <SelectItem value="dessert">Dessert</SelectItem>
                <SelectItem value="beverage">Beverage</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recipes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
            <p className="text-gray-600">Loading recipes...</p>
          </div>
        </div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recipes Found</h3>
            <p className="text-gray-600">No recipes match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-200 relative">
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url || "/placeholder.svg"}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge className={getStatusColor(recipe.moderation_status)}>{recipe.moderation_status}</Badge>
                  <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm">
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
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{recipe.title}</h3>
                <p className="text-sm text-gray-600 mb-3">by {recipe.author_username}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.prep_time_minutes + recipe.cook_time_minutes}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servings}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>
                      {recipe.average_rating.toFixed(1)} ({recipe.rating_count})
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">Created: {new Date(recipe.created_at).toLocaleDateString()}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
          </DialogHeader>

          {selectedRecipe && (
            <div className="space-y-4">
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
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedRecipe(null)
                setDeleteReason("")
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
