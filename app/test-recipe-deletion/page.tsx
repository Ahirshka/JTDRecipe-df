"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, User, Database, Key, CheckCircle, XCircle, AlertTriangle, RefreshCw, Eye, ChefHat } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface Recipe {
  id: string
  title: string
  author_username: string
  author_id: string
  moderation_status: string
  created_at: string
}

interface TestResult {
  step: string
  status: "success" | "error" | "warning" | "info"
  message: string
  data?: any
}

export default function TestRecipeDeletionPage() {
  const { user, isAuthenticated } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [deleteReason, setDeleteReason] = useState("Test deletion from debug page")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)
  const [authDebug, setAuthDebug] = useState<any>(null)

  useEffect(() => {
    loadRecipes()
    debugAuth()
  }, [])

  const addResult = (step: string, status: "success" | "error" | "warning" | "info", message: string, data?: any) => {
    setTestResults((prev) => [...prev, { step, status, message, data }])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const debugAuth = async () => {
    try {
      const response = await fetch("/api/debug/auth", {
        credentials: "include",
      })
      const data = await response.json()
      setAuthDebug(data)
    } catch (error) {
      console.error("Auth debug failed:", error)
    }
  }

  const loadRecipes = async () => {
    try {
      const response = await fetch("/api/recipes", {
        credentials: "include",
      })
      const data = await response.json()

      if (data.success && data.recipes) {
        // Get first few recipes for testing
        const testRecipes = data.recipes.slice(0, 10).map((recipe: any) => ({
          id: recipe.id,
          title: recipe.title,
          author_username: recipe.author_username,
          author_id: recipe.author_id,
          moderation_status: recipe.moderation_status,
          created_at: recipe.created_at,
        }))
        setRecipes(testRecipes)
      }
    } catch (error) {
      console.error("Failed to load recipes:", error)
    }
  }

  const testAuthenticationFlow = async () => {
    clearResults()
    addResult("auth-start", "info", "Starting authentication flow test...")

    // Test 1: Check if user is logged in
    if (!isAuthenticated || !user) {
      addResult("auth-check", "error", "User is not authenticated", { isAuthenticated, user })
      return
    }
    addResult("auth-check", "success", `User is authenticated: ${user.username}`, {
      id: user.id,
      username: user.username,
      role: user.role,
    })

    // Test 2: Check user permissions
    const canModerate = ["admin", "owner", "moderator"].includes(user.role)
    if (!canModerate) {
      addResult("permission-check", "error", `User role '${user.role}' cannot moderate recipes`, { role: user.role })
      return
    }
    addResult("permission-check", "success", `User has moderation permissions: ${user.role}`, { role: user.role })

    // Test 3: Test auth endpoint
    try {
      const response = await fetch("/api/debug/auth", {
        credentials: "include",
      })
      const data = await response.json()

      if (data.success) {
        addResult("auth-endpoint", "success", "Auth endpoint working correctly", data)
      } else {
        addResult("auth-endpoint", "error", "Auth endpoint failed", data)
      }
    } catch (error) {
      addResult("auth-endpoint", "error", "Auth endpoint request failed", { error: error.message })
    }

    // Test 4: Test cookie presence
    const cookies = document.cookie
    const hasAuthToken = cookies.includes("auth-token")
    if (hasAuthToken) {
      addResult("cookie-check", "success", "Auth token cookie is present", { cookies })
    } else {
      addResult("cookie-check", "warning", "Auth token cookie not found", { cookies })
    }
  }

  const testDatabaseConnection = async () => {
    addResult("db-start", "info", "Testing database connection...")

    try {
      const response = await fetch("/api/test/database-connection", {
        credentials: "include",
      })
      const data = await response.json()

      if (data.success) {
        addResult("db-connection", "success", "Database connection successful", data)
      } else {
        addResult("db-connection", "error", "Database connection failed", data)
      }
    } catch (error) {
      addResult("db-connection", "error", "Database connection request failed", { error: error.message })
    }
  }

  const testRecipeExists = async (recipeId: string) => {
    addResult("recipe-check", "info", `Checking if recipe ${recipeId} exists...`)

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        credentials: "include",
      })
      const data = await response.json()

      if (data.success) {
        addResult("recipe-exists", "success", `Recipe found: ${data.recipe.title}`, {
          id: data.recipe.id,
          title: data.recipe.title,
          author: data.recipe.author_username,
        })
        return true
      } else {
        addResult("recipe-exists", "error", "Recipe not found", data)
        return false
      }
    } catch (error) {
      addResult("recipe-exists", "error", "Recipe check request failed", { error: error.message })
      return false
    }
  }

  const testDeleteAPI = async (recipeId: string, reason: string) => {
    addResult("delete-start", "info", `Starting deletion test for recipe ${recipeId}...`)

    try {
      const response = await fetch("/api/admin/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipeId: recipeId,
          reason: reason,
        }),
      })

      addResult("delete-request", "info", `Delete request sent. Status: ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      const data = await response.json()

      if (data.success) {
        addResult("delete-success", "success", `Recipe deleted successfully: ${data.message}`, data)
        return true
      } else {
        addResult("delete-failed", "error", `Delete failed: ${data.error}`, data)
        return false
      }
    } catch (error) {
      addResult("delete-error", "error", "Delete request failed", {
        error: error.message,
        stack: error.stack,
      })
      return false
    }
  }

  const runFullDeletionTest = async () => {
    if (!selectedRecipeId) {
      addResult("test-error", "error", "Please select a recipe to test deletion")
      return
    }

    setLoading(true)
    clearResults()

    addResult("test-start", "info", "Starting comprehensive recipe deletion test...")

    // Step 1: Test authentication
    await testAuthenticationFlow()

    // Step 2: Test database connection
    await testDatabaseConnection()

    // Step 3: Check if recipe exists
    const recipeExists = await testRecipeExists(selectedRecipeId)
    if (!recipeExists) {
      setLoading(false)
      return
    }

    // Step 4: Test the delete API
    const deleteSuccess = await testDeleteAPI(selectedRecipeId, deleteReason)

    // Step 5: Verify deletion
    if (deleteSuccess) {
      addResult("verify-start", "info", "Verifying recipe was deleted...")

      setTimeout(async () => {
        const stillExists = await testRecipeExists(selectedRecipeId)
        if (!stillExists) {
          addResult("verify-success", "success", "Recipe successfully deleted and verified")
        } else {
          addResult("verify-failed", "warning", "Recipe still exists after deletion attempt")
        }
        setLoading(false)
      }, 1000)
    } else {
      setLoading(false)
    }

    // Reload recipes list
    setTimeout(() => {
      loadRecipes()
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Eye className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "error":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Recipe Deletion Debug Tool</h1>
        <p className="text-gray-600">Comprehensive testing tool for debugging recipe deletion issues</p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Current User Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Authentication Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {isAuthenticated ? (
                  <Badge className="bg-green-100 text-green-800">Authenticated</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">Not Authenticated</Badge>
                )}
              </div>
            </div>
            <div>
              <Label>Username</Label>
              <div className="mt-1 font-medium">{user?.username || "Not logged in"}</div>
            </div>
            <div>
              <Label>Role</Label>
              <div className="mt-1">
                <Badge
                  className={
                    ["admin", "owner", "moderator"].includes(user?.role || "")
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {user?.role || "None"}
                </Badge>
              </div>
            </div>
          </div>

          {authDebug && (
            <div className="mt-4">
              <Label>Auth Debug Info</Label>
              <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(authDebug, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipeSelect">Select Recipe to Test Deletion</Label>
            <select
              id="recipeSelect"
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">Select a recipe...</option>
              {recipes.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title} (by {recipe.author_username}) - {recipe.moderation_status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="deleteReason">Deletion Reason</Label>
            <Textarea
              id="deleteReason"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter reason for deletion..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={runFullDeletionTest} disabled={loading || !selectedRecipeId}>
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Run Full Deletion Test
                </>
              )}
            </Button>
            <Button variant="outline" onClick={testAuthenticationFlow}>
              <Key className="w-4 h-4 mr-2" />
              Test Auth Only
            </Button>
            <Button variant="outline" onClick={testDatabaseConnection}>
              <Database className="w-4 h-4 mr-2" />
              Test DB Only
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.step}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                      {result.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">View Details</summary>
                          <pre className="mt-2 p-2 bg-white border rounded overflow-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Recipes */}
      <Card>
        <CardHeader>
          <CardTitle>Available Recipes for Testing</CardTitle>
        </CardHeader>
        <CardContent>
          {recipes.length === 0 ? (
            <p className="text-gray-600">No recipes found. Make sure you have recipes in your database.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRecipeId === recipe.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedRecipeId(recipe.id)}
                >
                  <h3 className="font-medium mb-2">{recipe.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">by {recipe.author_username}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{recipe.moderation_status}</Badge>
                    <span className="text-xs text-gray-500">ID: {recipe.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Debug Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure you're logged in as an admin, owner, or moderator</li>
            <li>Select a recipe from the list below (click on a recipe card)</li>
            <li>Enter a reason for deletion (optional)</li>
            <li>Click "Run Full Deletion Test" to execute all tests</li>
            <li>Review the test results to identify any issues</li>
            <li>Use individual test buttons to isolate specific problems</li>
          </ol>

          <Separator className="my-4" />

          <div className="text-sm text-gray-600">
            <p className="font-medium mb-2">Test Steps:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Authentication verification</li>
              <li>Permission checking</li>
              <li>Database connection test</li>
              <li>Recipe existence verification</li>
              <li>Delete API execution</li>
              <li>Deletion verification</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
