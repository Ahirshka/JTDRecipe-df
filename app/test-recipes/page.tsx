"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Clock, XCircle, Plus, RefreshCw } from "lucide-react"

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
  moderation_status: string
  created_at: string
}

export default function TestRecipesPage() {
  const [approvedRecipes, setApprovedRecipes] = useState<Recipe[]>([])
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const loadRecipes = async () => {
    setLoading(true)
    try {
      // Load approved recipes
      const approvedResponse = await fetch("/api/recipes")
      const approvedData = await approvedResponse.json()
      setApprovedRecipes(approvedData.recipes || [])

      // Load pending recipes
      const pendingResponse = await fetch("/api/admin/pending-recipes")
      const pendingData = await pendingResponse.json()
      setPendingRecipes(pendingData.recipes || [])
    } catch (error) {
      console.error("Failed to load recipes:", error)
      setMessage("Failed to load recipes")
    } finally {
      setLoading(false)
    }
  }

  const addTestRecipes = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-recipes", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        setMessage("Test recipes added successfully!")
        await loadRecipes()
      } else {
        setMessage(`Failed to add test recipes: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to add test recipes:", error)
      setMessage("Failed to add test recipes")
    } finally {
      setLoading(false)
    }
  }

  const moderateRecipe = async (recipeId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/admin/moderate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, status, notes: `Test moderation: ${status}` }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(`Recipe ${status} successfully!`)
        await loadRecipes()
      } else {
        setMessage(`Failed to ${status} recipe: ${data.error}`)
      }
    } catch (error) {
      console.error(`Failed to ${status} recipe:`, error)
      setMessage(`Failed to ${status} recipe`)
    }
  }

  useEffect(() => {
    loadRecipes()
  }, [])

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recipe Database Test</h1>
        <div className="flex gap-2">
          <Button onClick={loadRecipes} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={addTestRecipes} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Add Test Recipes
          </Button>
        </div>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Recipes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Approved Recipes ({approvedRecipes.length})
            </CardTitle>
            <CardDescription>These recipes are published and visible to users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {approvedRecipes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No approved recipes found</p>
              ) : (
                approvedRecipes.map((recipe) => (
                  <div key={recipe.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{recipe.title}</h3>
                      <Badge className={getModerationBadgeColor(recipe.moderation_status)}>
                        {recipe.moderation_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">{recipe.category}</Badge>
                      <Badge variant="outline">{recipe.difficulty}</Badge>
                      <Badge variant="outline">{recipe.prep_time_minutes + recipe.cook_time_minutes} min</Badge>
                      <Badge variant="outline">{recipe.servings} servings</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      By {recipe.author_username} • {new Date(recipe.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Recipes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pending Recipes ({pendingRecipes.length})
            </CardTitle>
            <CardDescription>These recipes need moderation approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRecipes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending recipes found</p>
              ) : (
                pendingRecipes.map((recipe) => (
                  <div key={recipe.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{recipe.title}</h3>
                      <Badge className={getModerationBadgeColor(recipe.moderation_status)}>
                        {recipe.moderation_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs mb-3">
                      <Badge variant="outline">{recipe.category}</Badge>
                      <Badge variant="outline">{recipe.difficulty}</Badge>
                      <Badge variant="outline">{recipe.prep_time_minutes + recipe.cook_time_minutes} min</Badge>
                      <Badge variant="outline">{recipe.servings} servings</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => moderateRecipe(recipe.id, "approved")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => moderateRecipe(recipe.id, "rejected")}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      By {recipe.author_username} • {new Date(recipe.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
