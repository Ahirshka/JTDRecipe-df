"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Search, Trash2, Eye, Edit, RefreshCw, ChefHat, Clock, Users, Star } from "lucide-react"

interface Recipe {
  id: number
  title: string
  description?: string
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  moderation_status: string
  is_published: boolean
  rating: number
  review_count: number
  view_count: number
  created_at: string
  updated_at: string
  approved_at?: string
}

export default function ManageRecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  })
  const router = useRouter()

  useEffect(() => {
    loadRecipes()
  }, [statusFilter, searchTerm])

  const loadRecipes = async () => {
    console.log("🔄 [MANAGE-RECIPES] Loading recipes...")
    setLoading(true)
    setMessage("")

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchTerm,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })

      const response = await fetch(`/api/admin/recipes/manage?${params}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("📡 [MANAGE-RECIPES] Response status:", response.status)

      const data = await response.json()
      console.log("📋 [MANAGE-RECIPES] Response data:", data)

      if (data.success) {
        console.log(`✅ [MANAGE-RECIPES] Loaded ${data.recipes.length} recipes`)
        setRecipes(data.recipes)
        setPagination(data.pagination)

        if (data.recipes.length === 0) {
          setMessage("No recipes found matching your criteria")
        }
      } else {
        console.log("❌ [MANAGE-RECIPES] Failed to load recipes:", data.error)
        setMessage(data.error || "Failed to load recipes")
      }
    } catch (error) {
      console.error("❌ [MANAGE-RECIPES] Failed to load recipes:", error)
      setMessage("Failed to load recipes - network error")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipe = (recipe: Recipe) => {
    console.log("🗑️ [MANAGE-RECIPES] Opening delete dialog for recipe:", recipe.id)
    setSelectedRecipe(recipe)
    setDeleteReason("")
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!selectedRecipe) {
      console.log("❌ [MANAGE-RECIPES] No selected recipe for deletion")
      return
    }

    setProcessing(true)
    console.log("🔄 [MANAGE-RECIPES] Executing deletion:", {
      recipeId: selectedRecipe.id,
      reason: deleteReason,
    })

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

      console.log("📡 [MANAGE-RECIPES] Delete response status:", response.status)

      const data = await response.json()
      console.log("📡 [MANAGE-RECIPES] Delete response data:", data)

      if (data.success) {
        console.log("✅ [MANAGE-RECIPES] Recipe deleted successfully")
        setMessage(`Recipe "${selectedRecipe.title}" deleted successfully`)
        setDeleteDialogOpen(false)
        setSelectedRecipe(null)
        setDeleteReason("")

        // Reload recipes to update the list
        await loadRecipes()
      } else {
        console.log("❌ [MANAGE-RECIPES] Failed to delete recipe:", data.error)
        setMessage(data.error || "Failed to delete recipe")
      }
    } catch (error) {
      console.error("❌ [MANAGE-RECIPES] Delete failed:", error)
      setMessage("Delete failed - network error")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      appetizer: "bg-green-100 text-green-800",
      "main-course": "bg-blue-100 text-blue-800",
      dessert: "bg-pink-100 text-pink-800",
      beverage: "bg-purple-100 text-purple-800",
      snack: "bg-yellow-100 text-yellow-800",
      breakfast: "bg-orange-100 text-orange-800",
      lunch: "bg-teal-100 text-teal-800",
      dinner: "bg-red-100 text-red-800",
    }
    return colors[category?.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading recipes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button variant="outline" onClick={() => router.push("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <Button variant="outline" onClick={loadRecipes} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Manage Recipes</h1>
          </div>
          <p className="text-gray-600">View, search, and manage all recipes in the system</p>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search recipes by title or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recipes List */}
        <Card>
          <CardHeader>
            <CardTitle>Recipes ({pagination.total})</CardTitle>
            <CardDescription>All recipes in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
                <p className="text-gray-600">Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{recipe.title}</h3>
                          <Badge className={getStatusBadgeColor(recipe.moderation_status)}>
                            {recipe.moderation_status}
                          </Badge>
                          {recipe.is_published && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Published
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">by {recipe.author_username}</p>

                        {recipe.description && <p className="text-gray-700 mb-3 line-clamp-2">{recipe.description}</p>}

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getCategoryColor(recipe.category)} variant="outline">
                            {recipe.category.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                          <Badge variant="outline">{recipe.difficulty}</Badge>
                          <Badge variant="outline">
                            <Clock className="w-3 h-3 mr-1" />
                            {recipe.prep_time_minutes + recipe.cook_time_minutes}m
                          </Badge>
                          <Badge variant="outline">
                            <Users className="w-3 h-3 mr-1" />
                            {recipe.servings}
                          </Badge>
                          {recipe.rating > 0 && (
                            <Badge variant="outline">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                              {recipe.rating.toFixed(1)} ({recipe.review_count})
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {new Date(recipe.created_at).toLocaleDateString()}</span>
                          {recipe.approved_at && (
                            <span>Approved: {new Date(recipe.approved_at).toLocaleDateString()}</span>
                          )}
                          <span>Views: {recipe.view_count}</span>
                        </div>
                      </div>

                      {recipe.image_url && (
                        <img
                          src={recipe.image_url || "/placeholder.svg"}
                          alt={recipe.title}
                          className="w-24 h-24 object-cover rounded-lg ml-4"
                        />
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button size="sm" variant="outline" onClick={() => router.push(`/recipe/${recipe.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/recipes/${recipe.id}/edit`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteRecipe(recipe)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
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
                    <ChefHat className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">{selectedRecipe.title}</span>
                  </div>
                  <p className="text-sm text-red-700">
                    by {selectedRecipe.author_username} • {selectedRecipe.moderation_status}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ This action cannot be undone. The recipe and all associated data will be permanently deleted.
                  </p>
                </div>
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
    </div>
  )
}
