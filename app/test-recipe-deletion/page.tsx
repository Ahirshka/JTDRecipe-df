"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from "lucide-react"

interface Recipe {
  id: string
  title: string
  author_username: string
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
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [reason, setReason] = useState("")
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingRecipes, setLoadingRecipes] = useState(true)

  // Load recipes on component mount
  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      setLoadingRecipes(true)
      const response = await fetch("/api/recipes")
      const data = await response.json()

      if (data.success && data.recipes) {
        setRecipes(data.recipes.slice(0, 10)) // Limit to first 10 for testing
      } else {
        console.error("Failed to load recipes:", data)
      }
    } catch (error) {
      console.error("Error loading recipes:", error)
    } finally {
      setLoadingRecipes(false)
    }
  }

  const addResult = (step: string, status: TestResult["status"], message: string, data?: any) => {
    const result: TestResult = { step, status, message, data }
    setTestResults((prev) => [...prev, result])
    console.log(`[${status.toUpperCase()}] ${step}: ${message}`, data)
  }

  const clearResults = () => {
    setTestResults([])
  }

  const testAuthOnly = async () => {
    setIsLoading(true)
    clearResults()

    addResult("Auth Test", "info", "Starting authentication test...")

    try {
      // Test 1: Check cookies in browser
      const cookies = document.cookie
      addResult(
        "Browser Cookies",
        cookies ? "success" : "warning",
        cookies ? `Found cookies: ${cookies.split(";").length} cookies` : "No cookies found in browser",
        { cookies: cookies.split(";").map((c) => c.trim().split("=")[0]) },
      )

      // Test 2: Call auth debug API
      const authResponse = await fetch("/api/debug/auth")
      const authData = await authResponse.json()

      if (authData.success) {
        addResult("Auth Debug API", "success", "Auth debug API responded successfully", authData)

        if (authData.serverAuthResult?.success) {
          addResult(
            "User Authentication",
            "success",
            `User authenticated: ${authData.serverAuthResult.user.username} (${authData.serverAuthResult.user.role})`,
            authData.serverAuthResult.user,
          )
        } else {
          addResult(
            "User Authentication",
            "error",
            authData.serverAuthResult?.error || "Authentication failed",
            authData.serverAuthResult,
          )
        }

        if (authData.tokenVerification?.success) {
          addResult(
            "Token Verification",
            "success",
            `Token valid for user: ${authData.tokenVerification.payload.email}`,
            authData.tokenVerification.payload,
          )
        } else {
          addResult(
            "Token Verification",
            "error",
            authData.tokenVerification?.error || "Token verification failed",
            authData.tokenVerification,
          )
        }
      } else {
        addResult("Auth Debug API", "error", authData.error || "Auth debug failed", authData)
      }

      // Test 3: Check current user endpoint
      const meResponse = await fetch("/api/auth/me")
      const meData = await meResponse.json()

      if (meResponse.ok && meData.success) {
        addResult(
          "Current User API",
          "success",
          `Current user API: ${meData.user.username} (${meData.user.role})`,
          meData.user,
        )
      } else {
        addResult("Current User API", "error", meData.error || "Failed to get current user", meData)
      }
    } catch (error) {
      addResult("Auth Test Error", "error", `Authentication test failed: ${error.message}`)
    }

    setIsLoading(false)
  }

  const testDatabaseOnly = async () => {
    setIsLoading(true)
    clearResults()

    addResult("Database Test", "info", "Starting database connection test...")

    try {
      const response = await fetch("/api/test/database-connection")
      const data = await response.json()

      if (data.success) {
        addResult("Database Connection", "success", "Database connected successfully", data)

        if (data.tablesExist) {
          addResult("Database Tables", "success", `Tables exist: ${data.tables.join(", ")}`, data.tables)
        } else {
          addResult("Database Tables", "error", "Required tables missing", data.tables)
        }

        if (data.recipeCount > 0) {
          addResult("Recipe Data", "success", `Found ${data.recipeCount} recipes in database`, {
            count: data.recipeCount,
          })
        } else {
          addResult("Recipe Data", "warning", "No recipes found in database", { count: data.recipeCount })
        }
      } else {
        addResult("Database Connection", "error", data.error || "Database connection failed", data)
      }
    } catch (error) {
      addResult("Database Test Error", "error", `Database test failed: ${error.message}`)
    }

    setIsLoading(false)
  }

  const runFullDeletionTest = async () => {
    if (!selectedRecipeId) {
      addResult("Validation", "error", "Please select a recipe to test deletion")
      return
    }

    setIsLoading(true)
    clearResults()

    addResult("Full Deletion Test", "info", `Starting full deletion test for recipe: ${selectedRecipeId}`)

    try {
      // Step 1: Test Authentication
      addResult("Step 1", "info", "Testing authentication...")

      const authResponse = await fetch("/api/debug/auth")
      const authData = await authResponse.json()

      if (!authData.success || !authData.serverAuthResult?.success) {
        addResult("Authentication", "error", "Authentication failed - cannot proceed with deletion", authData)
        setIsLoading(false)
        return
      }

      const user = authData.serverAuthResult.user
      addResult("Authentication", "success", `Authenticated as: ${user.username} (${user.role})`, user)

      // Check permissions
      if (!["admin", "owner", "moderator"].includes(user.role)) {
        addResult("Permissions", "error", `Insufficient permissions. Role '${user.role}' cannot delete recipes`)
        setIsLoading(false)
        return
      }

      addResult("Permissions", "success", `User has deletion permissions (${user.role})`)

      // Step 2: Test Database Connection
      addResult("Step 2", "info", "Testing database connection...")

      const dbResponse = await fetch("/api/test/database-connection")
      const dbData = await dbResponse.json()

      if (!dbData.success) {
        addResult("Database", "error", "Database connection failed", dbData)
        setIsLoading(false)
        return
      }

      addResult("Database", "success", "Database connection verified", dbData)

      // Step 3: Verify Recipe Exists
      addResult("Step 3", "info", "Verifying recipe exists...")

      const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId)
      if (!selectedRecipe) {
        addResult("Recipe Lookup", "error", `Recipe with ID ${selectedRecipeId} not found in loaded recipes`)
        setIsLoading(false)
        return
      }

      addResult(
        "Recipe Lookup",
        "success",
        `Recipe found: "${selectedRecipe.title}" by ${selectedRecipe.author_username}`,
        selectedRecipe,
      )

      // Step 4: Attempt Deletion
      addResult("Step 4", "info", "Attempting recipe deletion...")

      const deleteResponse = await fetch("/api/admin/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          reason: reason || "Test deletion from debug page",
        }),
      })

      const deleteData = await deleteResponse.json()

      if (deleteResponse.ok && deleteData.success) {
        addResult("Recipe Deletion", "success", deleteData.message, deleteData)

        // Step 5: Verify Deletion
        addResult("Step 5", "info", "Verifying deletion...")

        // Reload recipes to verify deletion
        await loadRecipes()
        const stillExists = recipes.some((r) => r.id === selectedRecipeId)

        if (!stillExists) {
          addResult("Deletion Verification", "success", "Recipe successfully removed from database")
        } else {
          addResult("Deletion Verification", "warning", "Recipe may still exist - refresh the page to verify")
        }

        // Clear selection
        setSelectedRecipeId("")
      } else {
        addResult("Recipe Deletion", "error", deleteData.error || "Deletion failed", deleteData)
      }
    } catch (error) {
      addResult("Test Error", "error", `Full deletion test failed: ${error.message}`)
    }

    setIsLoading(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "text-green-700 bg-green-50 border-green-200"
      case "error":
        return "text-red-700 bg-red-50 border-red-200"
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-yellow-200"
      case "info":
        return "text-blue-700 bg-blue-50 border-blue-200"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Deletion Debug Tool</h1>
        <p className="text-muted-foreground">
          Comprehensive testing tool for debugging recipe deletion issues. This tool will test authentication, database
          connectivity, and the complete deletion process step-by-step.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
              <CardDescription>Select a recipe and run various tests to debug deletion issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="recipe-select">Select Recipe to Test</Label>
                {loadingRecipes ? (
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading recipes...</span>
                  </div>
                ) : (
                  <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a recipe to test deletion" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipes.map((recipe) => (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.title} - by {recipe.author_username}
                          <Badge variant="outline" className="ml-2">
                            {recipe.moderation_status}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label htmlFor="reason">Deletion Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for deletion (for testing purposes)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Test Options</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={testAuthOnly}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start bg-transparent"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}🔑 Test Auth Only
                  </Button>

                  <Button
                    onClick={testDatabaseOnly}
                    disabled={isLoading}
                    variant="outline"
                    className="justify-start bg-transparent"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    🗄️ Test DB Only
                  </Button>

                  <Button
                    onClick={runFullDeletionTest}
                    disabled={isLoading || !selectedRecipeId}
                    className="justify-start"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    🗑️ Run Full Deletion Test
                  </Button>
                </div>
              </div>

              {testResults.length > 0 && (
                <Button onClick={clearResults} variant="ghost" size="sm" className="w-full">
                  Clear Results
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Available Recipes */}
          <Card>
            <CardHeader>
              <CardTitle>Available Recipes ({recipes.length})</CardTitle>
              <CardDescription>Recipes loaded from the database for testing</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecipes ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading recipes...</span>
                </div>
              ) : recipes.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className={`p-2 border rounded text-sm cursor-pointer hover:bg-muted/50 ${
                        selectedRecipeId === recipe.id ? "bg-primary/10 border-primary" : ""
                      }`}
                      onClick={() => setSelectedRecipeId(recipe.id)}
                    >
                      <div className="font-medium">{recipe.title}</div>
                      <div className="text-muted-foreground">
                        by {recipe.author_username} • {recipe.moderation_status}
                      </div>
                      <div className="text-xs text-muted-foreground">ID: {recipe.id}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recipes found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Detailed results from the deletion tests</CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tests run yet. Select a recipe and run a test to see results here.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className={`p-3 border rounded-lg ${getStatusColor(result.status)}`}>
                      <div className="flex items-start gap-2">
                        {getStatusIcon(result.status)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{result.step}</div>
                          <div className="text-sm mt-1">{result.message}</div>
                          {result.data && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer hover:underline">View Details</summary>
                              <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
