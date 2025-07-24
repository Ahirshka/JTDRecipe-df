"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Clock, User, ChefHat, Timer, Users, Eye, CheckCircle, XCircle, Calendar, Tag, Utensils } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

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
  moderation_notes?: string
  is_published: boolean
  created_at: string
  updated_at: string
  ingredients?: Array<{ ingredient: string; amount: string; unit: string }>
  instructions?: Array<{ instruction: string; step_number: number }>
  tags?: string[]
}

export function AdminModerationPanel() {
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [moderating, setModerating] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [moderationNotes, setModerationNotes] = useState("")
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    loadPendingRecipes()
  }, [])

  const loadPendingRecipes = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/pending-recipes")
      if (response.ok) {
        const data = await response.json()
        setPendingRecipes(data.recipes || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load pending recipes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load pending recipes:", error)
      toast({
        title: "Error",
        description: "Failed to load pending recipes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const moderateRecipe = async (recipeId: string, status: "approved" | "rejected") => {
    try {
      setModerating(recipeId)

      const response = await fetch("/api/admin/moderate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeId,
          status,
          notes: moderationNotes.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Recipe ${status} successfully`,
        })

        // Remove the moderated recipe from the list
        setPendingRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId))
        setModerationNotes("")
        setViewDialogOpen(false)
        setSelectedRecipe(null)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${status} recipe`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Moderation error:", error)
      toast({
        title: "Error",
        description: `Failed to ${status} recipe`,
        variant: "destructive",
      })
    } finally {
      setModerating(null)
    }
  }

  const openRecipeDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    setModerationNotes("")
    setViewDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recipe Moderation</CardTitle>
          <CardDescription>Loading pending recipes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Recipe Moderation Queue
          </CardTitle>
          <CardDescription>
            {pendingRecipes.length} recipe{pendingRecipes.length !== 1 ? "s" : ""} awaiting your review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRecipes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No recipes pending moderation at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRecipes.map((recipe) => (
                <Card key={recipe.id} className="border-l-4 border-l-yellow-400">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{recipe.title}</h3>
                          <Badge className={getDifficultyColor(recipe.difficulty)}>{recipe.difficulty}</Badge>
                          <Badge variant="outline">{recipe.category}</Badge>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {recipe.description || "No description provided"}
                        </p>

                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{recipe.author_username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(recipe.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="w-4 h-4" />
                            <span>{recipe.prep_time_minutes + recipe.cook_time_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{recipe.servings} servings</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button onClick={() => openRecipeDetails(recipe)} variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>

                          <Button
                            onClick={() => moderateRecipe(recipe.id, "approved")}
                            disabled={moderating === recipe.id}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {moderating === recipe.id ? "Approving..." : "Approve"}
                          </Button>

                          <Button
                            onClick={() => moderateRecipe(recipe.id, "rejected")}
                            disabled={moderating === recipe.id}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {moderating === recipe.id ? "Rejecting..." : "Reject"}
                          </Button>
                        </div>
                      </div>

                      {recipe.image_url && (
                        <div className="ml-4 flex-shrink-0">
                          <Image
                            src={recipe.image_url || "/placeholder.svg"}
                            alt={recipe.title}
                            width={120}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipe Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Recipe Review: {selectedRecipe?.title}
            </DialogTitle>
            <DialogDescription>
              Review this recipe submission and decide whether to approve or reject it.
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* Recipe Header */}
                <div className="flex items-start gap-4">
                  {selectedRecipe.image_url && (
                    <Image
                      src={selectedRecipe.image_url || "/placeholder.svg"}
                      alt={selectedRecipe.title}
                      width={200}
                      height={150}
                      className="rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{selectedRecipe.title}</h2>
                    <p className="text-gray-600 mb-4">{selectedRecipe.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                          {selectedRecipe.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Timer className="w-4 h-4 text-gray-500" />
                        <span>{selectedRecipe.prep_time_minutes} min prep</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{selectedRecipe.cook_time_minutes} min cook</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span>{selectedRecipe.servings} servings</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Recipe Content */}
                <Tabs defaultValue="ingredients" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
                    <TabsTrigger value="instructions">Instructions</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ingredients" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        Ingredients ({selectedRecipe.ingredients?.length || 0})
                      </h3>
                      {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedRecipe.ingredients.map((ingredient, index) => (
                            <li key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <span className="font-medium">{ingredient.amount}</span>
                              <span className="text-gray-600">{ingredient.unit}</span>
                              <span>{ingredient.ingredient}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 italic">No ingredients listed</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="instructions" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <ChefHat className="w-4 h-4" />
                        Instructions ({selectedRecipe.instructions?.length || 0} steps)
                      </h3>
                      {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 ? (
                        <ol className="space-y-3">
                          {selectedRecipe.instructions
                            .sort((a, b) => a.step_number - b.step_number)
                            .map((instruction, index) => (
                              <li key={index} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {instruction.step_number}
                                </span>
                                <p className="flex-1 pt-0.5">{instruction.instruction}</p>
                              </li>
                            ))}
                        </ol>
                      ) : (
                        <p className="text-gray-500 italic">No instructions provided</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3">Recipe Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category:</span>
                            <Badge variant="outline">{selectedRecipe.category}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Difficulty:</span>
                            <Badge className={getDifficultyColor(selectedRecipe.difficulty)}>
                              {selectedRecipe.difficulty}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prep Time:</span>
                            <span>{selectedRecipe.prep_time_minutes} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cook Time:</span>
                            <span>{selectedRecipe.cook_time_minutes} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Time:</span>
                            <span>{selectedRecipe.prep_time_minutes + selectedRecipe.cook_time_minutes} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Servings:</span>
                            <span>{selectedRecipe.servings}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3">Submission Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Author:</span>
                            <span>{selectedRecipe.author_username}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Submitted:</span>
                            <span>{formatDate(selectedRecipe.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <Badge variant="secondary">{selectedRecipe.moderation_status}</Badge>
                          </div>
                        </div>

                        {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2 flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              Tags
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedRecipe.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* Moderation Actions */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="moderation-notes">Moderation Notes (Optional)</Label>
                    <Textarea
                      id="moderation-notes"
                      placeholder="Add any notes for the recipe author..."
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => moderateRecipe(selectedRecipe.id, "approved")}
                      disabled={moderating === selectedRecipe.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {moderating === selectedRecipe.id ? "Approving..." : "Approve Recipe"}
                    </Button>

                    <Button
                      onClick={() => moderateRecipe(selectedRecipe.id, "rejected")}
                      disabled={moderating === selectedRecipe.id}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {moderating === selectedRecipe.id ? "Rejecting..." : "Reject Recipe"}
                    </Button>

                    <Button onClick={() => setViewDialogOpen(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
