"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, CheckCircle, XCircle, Info } from "lucide-react"

interface Recipe {
  id: string
  title: string
  author_username: string
  moderation_status: string
  created_at: string
}

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
  details?: any
}

interface AuthTestResult {
  cookies: any
  headers: any
  tokenVerification: any
  userLookup: any
  serverAuthResult: any
}

export default function TestRecipeDeletionPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("")
  const [deletionReason, setDeletionReason] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [authResult, setAuthResult] = useState<TestResult | null>(null)
  const [dbResult, setDbResult] = useState<TestResult | null>(null)
  const [deletionResult, setDeletionResult] = useState<TestResult | null>(null)
  const [authDetails, setAuthDetails] = useState<AuthTestResult | null>(null)
  const [message, setMessage] = useState("")

  // Load recipes on component mount
  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      const response = await fetch("/api/recipes")
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes || [])
      }
    } catch (error) {
      console.error("Failed to load recipes:", error)
    }
  }

  const testAuthentication = async () => {
    setLoading(true)
    setAuthResult(null)
    setAuthDetails(null)

    try {
      console.log("🔍 Testing authentication...")
      const response = await fetch("/api/debug/auth", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()
      console.log("🔍 Auth test response:", data)

      if (data.success) {
        setAuthResult({
          success: true,
          message: "Authentication successful",
          data: data,
        })
        setAuthDetails(data)
      } else {
        setAuthResult({
          success: false,
          message: "Authentication failed",
          error: data.error || "Unknown error",
          details: data,
        })
        setAuthDetails(data)
      }
    } catch (error) {
      console.error("Auth test error:", error)
      setAuthResult({
        success: false,
        message: "Authentication test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const testDatabase = async () => {
    setLoading(true)
    setDbResult(null)

    try {
      console.log("🔍 Testing database connection...")
      const response = await fetch("/api/test/database-connection", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()
      console.log("🔍 Database test response:", data)

      if (data.success) {
        setDbResult({
          success: true,
          message: "Database connection successful",
          data: data,
        })
      } else {
        setDbResult({
          success: false,
          message: "Database connection failed",
          error: data.error || "Unknown error",
          details: data,
        })
      }
    } catch (error) {
      console.error("Database test error:", error)
      setDbResult({
        success: false,
        message: "Database test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const testFullDeletion = async () => {
    if (!selectedRecipeId) {
      alert("Please select a recipe to delete")
      return
    }

    setLoading(true)
    setDeletionResult(null)

    try {
      console.log("🗑️ Testing full recipe deletion...")
      console.log("🗑️ Recipe ID:", selectedRecipeId)
      console.log("🗑️ Reason:", deletionReason)

      const response = await fetch("/api/admin/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          reason: deletionReason || "Test deletion",
        }),
      })

      const data = await response.json()
      console.log("🗑️ Deletion test response:", data)

      if (data.success) {
        setDeletionResult({
          success: true,
          message: "Recipe deletion successful",
          data: data,
        })
        // Reload recipes to reflect the deletion
        await loadRecipes()
        setSelectedRecipeId("")
        setDeletionReason("")
      } else {
        setDeletionResult({
          success: false,
          message: "Recipe deletion failed",
          error: data.error || "Unknown error",
          details: data,
        })
      }
    } catch (error) {
      console.error("Deletion test error:", error)
      setDeletionResult({
        success: false,
        message: "Deletion test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const runTest = async () => {
    setLoading(true)
    setMessage("Running deletion test...")

    try {
      const response = await fetch("/api/admin/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipeId: "test-recipe-id",
          reason: "Test deletion",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage("✅ Test completed successfully")
      } else {
        setMessage(`❌ Test failed: ${data.error}`)
      }
    } catch (error) {
      setMessage(`❌ Test error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (result: TestResult | null) => {
    if (!result) return <Info className="h-4 w-4 text-gray-400" />
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusColor = (result: TestResult | null) => {
    if (!result) return "text-gray-600"
    if (result.success) return "text-green-600"
    return "text-red-600"
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Deletion Debug Tool</h1>
        <p className="text-gray-600">
          Comprehensive testing tool for debugging recipe deletion authentication and database operations.
        </p>
      </div>

      {/* Recipe Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recipe Selection</CardTitle>
          <CardDescription>Select a recipe to test deletion functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Available Recipes ({recipes.length})</label>
            <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recipe to delete..." />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    <div className="flex items-center gap-2">
                      <span>{recipe.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {recipe.moderation_status}
                      </Badge>
                      <span className="text-xs text-gray-500">by {recipe.author_username}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deletion Reason (Optional)</label>
            <Textarea
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder="Enter reason for deletion..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Run individual tests or complete deletion test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={testAuthentication} disabled={loading} variant="outline">
              🔑 Test Auth Only
            </Button>
            <Button onClick={testDatabase} disabled={loading} variant="outline">
              🗄️ Test DB Only
            </Button>
            <Button
              onClick={testFullDeletion}
              disabled={loading || !selectedRecipeId}
              className="bg-red-600 hover:bg-red-700"
            >
              🗑️ Run Full Deletion Test
            </Button>
            <Button onClick={runTest} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Running Test..." : "🗑️ Run Deletion Test"}
            </Button>
          </div>

          {message && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      <div className="space-y-6">
        {/* Authentication Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(authResult)}
              <span className={getStatusColor(authResult)}>Authentication Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${authResult.success ? "bg-green-50" : "bg-red-50"}`}>
                  <p className={authResult.success ? "text-green-800" : "text-red-800"}>{authResult.message}</p>
                  {authResult.error && <p className="text-red-600 text-sm mt-2">Error: {authResult.error}</p>}
                </div>

                {authDetails && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-blue-600">
                      <ChevronRight className="h-4 w-4" />
                      View Authentication Details
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium">Cookies ({authDetails.cookies?.total || 0})</h4>
                            <p className="text-sm text-gray-600">
                              Names: {authDetails.cookies?.names?.join(", ") || "None"}
                            </p>
                            {authDetails.cookies?.authToken && (
                              <p className="text-sm text-gray-600">
                                Auth Token: {authDetails.cookies.authToken.substring(0, 50)}...
                              </p>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium">Token Verification</h4>
                            <p
                              className={`text-sm ${authDetails.tokenVerification?.success ? "text-green-600" : "text-red-600"}`}
                            >
                              Status: {authDetails.tokenVerification?.success ? "Valid" : "Invalid"}
                            </p>
                            {authDetails.tokenVerification?.payload && (
                              <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(authDetails.tokenVerification.payload, null, 2)}
                              </pre>
                            )}
                          </div>

                          <div>
                            <h4 className="font-medium">Server Auth Result</h4>
                            <p
                              className={`text-sm ${authDetails.serverAuthResult?.success ? "text-green-600" : "text-red-600"}`}
                            >
                              Status: {authDetails.serverAuthResult?.success ? "Authenticated" : "Failed"}
                            </p>
                            {authDetails.serverAuthResult?.user && (
                              <div className="text-sm text-gray-600">
                                <p>User: {authDetails.serverAuthResult.user.username}</p>
                                <p>Role: {authDetails.serverAuthResult.user.role}</p>
                                <p>ID: {authDetails.serverAuthResult.user.id}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Click "Test Auth Only" to run authentication test</p>
            )}
          </CardContent>
        </Card>

        {/* Database Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(dbResult)}
              <span className={getStatusColor(dbResult)}>Database Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dbResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${dbResult.success ? "bg-green-50" : "bg-red-50"}`}>
                  <p className={dbResult.success ? "text-green-800" : "text-red-800"}>{dbResult.message}</p>
                  {dbResult.error && <p className="text-red-600 text-sm mt-2">Error: {dbResult.error}</p>}
                </div>

                {dbResult.data && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-blue-600">
                      <ChevronRight className="h-4 w-4" />
                      View Database Details
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs overflow-x-auto">{JSON.stringify(dbResult.data, null, 2)}</pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Click "Test DB Only" to run database test</p>
            )}
          </CardContent>
        </Card>

        {/* Deletion Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(deletionResult)}
              <span className={getStatusColor(deletionResult)}>Recipe Deletion Test</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deletionResult ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${deletionResult.success ? "bg-green-50" : "bg-red-50"}`}>
                  <p className={deletionResult.success ? "text-green-800" : "text-red-800"}>{deletionResult.message}</p>
                  {deletionResult.error && <p className="text-red-600 text-sm mt-2">Error: {deletionResult.error}</p>}
                </div>

                {deletionResult.data && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-blue-600">
                      <ChevronRight className="h-4 w-4" />
                      View Deletion Details
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <pre className="text-xs overflow-x-auto">{JSON.stringify(deletionResult.data, null, 2)}</pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {deletionResult.details && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-blue-600">
                      <ChevronRight className="h-4 w-4" />
                      View Error Details
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-red-50 p-4 rounded-lg">
                        <pre className="text-xs overflow-x-auto text-red-800">
                          {JSON.stringify(deletionResult.details, null, 2)}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Select a recipe and click "Run Full Deletion Test" to test deletion</p>
            )}
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Running test...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
