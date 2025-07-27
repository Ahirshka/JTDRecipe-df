"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, CheckCircle, XCircle, Info } from "lucide-react"

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
  details?: any
}

interface Recipe {
  id: string
  title: string
  author_username: string
  moderation_status: string
  created_at: string
}

export default function TestRecipeDeletionPage() {
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [deletionReason, setDeletionReason] = useState("")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<{
    auth?: TestResult
    database?: TestResult
    deletion?: TestResult
  }>({})

  // Load available recipes
  const loadRecipes = async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  // Test authentication only
  const testAuth = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/debug/auth")
      const data = await response.json()

      setTestResults((prev) => ({
        ...prev,
        auth: {
          success: data.success && data.serverAuthResult?.success,
          message:
            data.success && data.serverAuthResult?.success
              ? `Authenticated as ${data.serverAuthResult.user?.username} (${data.serverAuthResult.user?.role})`
              : "Authentication failed",
          data,
          error: data.error || data.serverAuthResult?.error,
        },
      }))
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        auth: {
          success: false,
          message: "Auth test failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading(false)
    }
  }

  // Test database connection only
  const testDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test/database-connection")
      const data = await response.json()

      setTestResults((prev) => ({
        ...prev,
        database: {
          success: data.success,
          message: data.success
            ? `Database connected - ${data.data?.recipeCount || 0} recipes, ${data.data?.userCount || 0} users`
            : "Database connection failed",
          data,
          error: data.error,
        },
      }))
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        database: {
          success: false,
          message: "Database test failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading(false)
    }
  }

  // Run full deletion test
  const runFullDeletionTest = async () => {
    if (!selectedRecipeId) {
      alert("Please select a recipe to test deletion")
      return
    }

    try {
      setLoading(true)
      setTestResults({}) // Clear previous results

      // Step 1: Test Auth
      console.log("🔍 Step 1: Testing authentication...")
      await testAuth()
      await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay for UI

      // Step 2: Test Database
      console.log("🔍 Step 2: Testing database connection...")
      await testDatabase()
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Step 3: Attempt deletion
      console.log("🔍 Step 3: Attempting recipe deletion...")
      const deleteResponse = await fetch("/api/admin/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          reason: deletionReason || "Test deletion from debug tool",
        }),
      })

      const deleteData = await deleteResponse.json()

      setTestResults((prev) => ({
        ...prev,
        deletion: {
          success: deleteData.success,
          message: deleteData.success
            ? `Recipe deleted successfully: ${deleteData.data?.deletedRecipe?.title}`
            : `Deletion failed: ${deleteData.error}`,
          data: deleteData,
          error: deleteData.error,
          details: deleteData.debug || deleteData.details,
        },
      }))

      // Reload recipes if deletion was successful
      if (deleteData.success) {
        await loadRecipes()
        setSelectedRecipeId("")
        setDeletionReason("")
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        deletion: {
          success: false,
          message: "Deletion test failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    } finally {
      setLoading(false)
    }
  }

  // Load recipes on component mount
  React.useEffect(() => {
    loadRecipes()
  }, [])

  const getStatusIcon = (result?: TestResult) => {
    if (!result) return <Info className="h-4 w-4 text-gray-400" />
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (result?: TestResult) => {
    if (!result) return <Badge variant="secondary">Not Run</Badge>
    if (result.success)
      return (
        <Badge variant="default" className="bg-green-500">
          Success
        </Badge>
      )
    return <Badge variant="destructive">Failed</Badge>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Deletion Debug Tool</h1>
        <p className="text-gray-600">
          Comprehensive testing tool for debugging recipe deletion issues. This tool will test authentication, database
          connectivity, and the actual deletion process step by step.
        </p>
      </div>

      {/* Recipe Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recipe Selection</CardTitle>
          <CardDescription>
            Select a recipe to test deletion. Only recipes you have permission to delete will be processed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={loadRecipes} disabled={loading} variant="outline">
              {loading ? "Loading..." : "Refresh Recipes"}
            </Button>
            <Badge variant="secondary">{recipes.length} recipes available</Badge>
          </div>

          {recipes.length > 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipe-select">Select Recipe to Delete</Label>
                <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a recipe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.title} - by {recipe.author_username} ({recipe.moderation_status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deletion-reason">Deletion Reason (Optional)</Label>
                <Textarea
                  id="deletion-reason"
                  placeholder="Enter reason for deletion..."
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Run individual tests or the complete deletion test suite.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={testAuth} disabled={loading} variant="outline">
              🔑 Test Auth Only
            </Button>

            <Button onClick={testDatabase} disabled={loading} variant="outline">
              🗄️ Test DB Only
            </Button>

            <Button
              onClick={runFullDeletionTest}
              disabled={loading || !selectedRecipeId}
              className="bg-red-600 hover:bg-red-700"
            >
              🗑️ Run Full Deletion Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-4">
        {/* Authentication Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResults.auth)}
              Authentication Test
              {getStatusBadge(testResults.auth)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.auth ? (
              <div className="space-y-4">
                <p className={testResults.auth.success ? "text-green-600" : "text-red-600"}>
                  {testResults.auth.message}
                </p>

                {testResults.auth.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700">{testResults.auth.error}</p>
                  </div>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                    <ChevronRight className="h-4 w-4" />
                    View Authentication Details
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-gray-50 rounded border">
                      <pre className="text-xs overflow-auto">{JSON.stringify(testResults.auth.data, null, 2)}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <p className="text-gray-500">Authentication test not run yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Database Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResults.database)}
              Database Connection Test
              {getStatusBadge(testResults.database)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.database ? (
              <div className="space-y-4">
                <p className={testResults.database.success ? "text-green-600" : "text-red-600"}>
                  {testResults.database.message}
                </p>

                {testResults.database.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700">{testResults.database.error}</p>
                  </div>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                    <ChevronRight className="h-4 w-4" />
                    View Database Details
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-gray-50 rounded border">
                      <pre className="text-xs overflow-auto">{JSON.stringify(testResults.database.data, null, 2)}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <p className="text-gray-500">Database test not run yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Deletion Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(testResults.deletion)}
              Recipe Deletion Test
              {getStatusBadge(testResults.deletion)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.deletion ? (
              <div className="space-y-4">
                <p className={testResults.deletion.success ? "text-green-600" : "text-red-600"}>
                  {testResults.deletion.message}
                </p>

                {testResults.deletion.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800 font-medium">Error:</p>
                    <p className="text-red-700">{testResults.deletion.error}</p>
                  </div>
                )}

                {testResults.deletion.details && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-medium">Debug Details:</p>
                    <p className="text-yellow-700">{JSON.stringify(testResults.deletion.details)}</p>
                  </div>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                    <ChevronRight className="h-4 w-4" />
                    View Deletion Details
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="p-4 bg-gray-50 rounded border">
                      <pre className="text-xs overflow-auto">{JSON.stringify(testResults.deletion.data, null, 2)}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <p className="text-gray-500">Deletion test not run yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use This Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Step 1: Test Authentication</h4>
            <p className="text-sm text-gray-600">
              Click "Test Auth Only" to verify you're logged in and have the necessary permissions.
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium">Step 2: Test Database</h4>
            <p className="text-sm text-gray-600">
              Click "Test DB Only" to verify database connectivity and table structure.
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium">Step 3: Full Deletion Test</h4>
            <p className="text-sm text-gray-600">
              Select a recipe, optionally add a reason, then click "Run Full Deletion Test" to test the complete
              process.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This tool will actually delete recipes if the test succeeds. Only use test recipes
              or recipes you're sure you want to delete.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
