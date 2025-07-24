"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Edit, ArrowLeft, ChefHat } from "lucide-react"

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
  ingredients: string
  instructions: string
  image_url?: string
  created_at: string
}

export default function RecipeModerationPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [moderationDialogOpen, setModerationDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")
  const [moderationNotes, setModerationNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    ingredients: "",
    instructions: "",
    category: "",
    difficulty: "",
  })

  useEffect(() => {
    loadPendingRecipes()
  }, [])

  const loadPendingRecipes = async () => {
    try {
      const response = await fetch("/api/admin/recipes/pending", {
        credentials: "include",
      })

      const data = await response.json()

      if (data.success) {
        setRecipes(data.recipes)
      } else {
        setMessage(data.error || "Failed to load pending recipes")
      }
    } catch (error) {
      console.error("Failed to load pending recipes:", error)
      setMessage("Failed to load pending recipes")
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = (recipe: Recipe, action: "approve" | "reject") => {
    setSelectedRecipe(recipe)
    setActionType(action)
    setModerationNotes("")
    setModerationDialogOpen(true)
  }

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setEditForm({
      title: recipe.title,
      description: recipe.description || "",
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      category: recipe.category,
      difficulty: recipe.difficulty,
    })
    setEditDialogOpen(true)
  }

  const executeModeration = async () => {
    if (!selectedRecipe) return

    setProcessing(true)
    try {
      const response = await fetch("/api/admin/recipes/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          action: actionType,
          notes: moderationNotes,
          edits: actionType === "approve" ? editForm : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`Recipe ${actionType}ed successfully`)
        setModerationDialogOpen(false)
        setEditDialogOpen(false)
        loadPendingRecipes() // Reload recipes
      } else {
        setMessage(data.error || "Moderation failed")
      }
    } catch (error) {
      console.error("Moderation failed:", error)
      setMessage("Moderation failed")
    } finally {
      setProcessing(false)
    }
  }

  const saveEditsAndApprove = async () => {
    if (!selectedRecipe) return

    setProcessing(true)
    try {
      const response = await fetch("/api/admin/recipes/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipeId: selectedRecipe.id,
          action: "approve",
          notes: "Recipe approved with edits",
          edits: editForm,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("Recipe approved with edits successfully")
        setEditDialogOpen(false)
        loadPendingRecipes()
      } else {
        setMessage(data.error || "Failed to save edits")
      }
    } catch (error) {
      console.error("Failed to save edits:", error)
      setMessage("Failed to save edits")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading pending recipes...</p>
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
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">Recipe Moderation</h1>
          </div>
          <p className="text-gray-600">Review and moderate user-submitted recipes</p>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Pending Recipes */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Recipes ({recipes.length})</CardTitle>
            <CardDescription>Recipes awaiting moderation</CardDescription>
          </CardHeader>
          <CardContent>
            {recipes.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                <p className="text-gray-600">No recipes pending review at the moment.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recipes.map((recipe) => (
                  <div key={recipe.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{recipe.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">by {recipe.author_username}</p>
                        {recipe.description && <p className="text-gray-700 mb-3">{recipe.description}</p>}

                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline">{recipe.category}</Badge>
                          <Badge variant="outline">{recipe.difficulty}</Badge>
                          <Badge variant="outline">
                            {recipe.prep_time_minutes + recipe.cook_time_minutes} min total
                          </Badge>
                          <Badge variant="outline">{recipe.servings} servings</Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2">Ingredients:</h4>
                            <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded">
                              {recipe.ingredients}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Instructions:</h4>
                            <div className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded">
                              {recipe.instructions}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(recipe.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {recipe.image_url && (
                        <img
                          src={recipe.image_url || "/placeholder.svg"}
                          alt={recipe.title}
                          className="w-32 h-32 object-cover rounded-lg ml-6"
                        />
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button onClick={() => handleEdit(recipe)} variant="outline" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit & Approve
                      </Button>
                      <Button
                        onClick={() => handleModerate(recipe, "approve")}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button onClick={() => handleModerate(recipe, "reject")} variant="destructive" className="flex-1">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Moderation Dialog */}
        <Dialog open={moderationDialogOpen} onOpenChange={setModerationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionType === "approve" ? "Approve Recipe" : "Reject Recipe"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {selectedRecipe && (
                <div className="flex items-center gap-2">
                  <ChefHat className="w-8 h-8" />
                  <span className="font-medium">{selectedRecipe.title}</span>
                </div>
              )}

              <div>
                <Label>Moderation Notes (optional)</Label>
                <Textarea
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Add any notes about this recipe..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModerationDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={executeModeration} disabled={processing}>
                {processing ? "Processing..." : `${actionType === "approve" ? "Approve" : "Reject"}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Recipe</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Breakfast">Breakfast</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                      <SelectItem value="Dinner">Dinner</SelectItem>
                      <SelectItem value="Dessert">Dessert</SelectItem>
                      <SelectItem value="Snack">Snack</SelectItem>
                      <SelectItem value="Appetizer">Appetizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select
                  value={editForm.difficulty}
                  onValueChange={(value) => setEditForm({ ...editForm, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ingredients</Label>
                <Textarea
                  value={editForm.ingredients}
                  onChange={(e) => setEditForm({ ...editForm, ingredients: e.target.value })}
                  rows={6}
                  placeholder="List ingredients, one per line..."
                />
              </div>

              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={editForm.instructions}
                  onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                  rows={8}
                  placeholder="List instructions, one per line..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEditsAndApprove} disabled={processing}>
                {processing ? "Saving..." : "Save & Approve"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
