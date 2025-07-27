"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, CheckCircle, XCircle, Info, User, Shield, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

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

interface UserInfo {
  id: string
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
  created_at: string
  last_login_at?: string
}

export default function TestRecipeDeletionPage() {
  const { user, isLoading, isAuthenticated, checkAuth } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("")
  const [deletionReason, setDeletionReason] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [authResult, setAuthResult] = useState<TestResult | null>(null)
  const [dbResult, setDbResult] = useState<TestResult | null>(null)
  const [deletionResult, setDeletionResult] = useState<TestResult | null>(null)
  const [authDetails, setAuthDetails] = useState<AuthTestResult | null>(null)
  const [message, setMessage] = useState("")
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [authStatus, setAuthStatus] = useState<{
    contextAuth: boolean
    serverAuth: boolean
    cookieAuth: boolean
    lastChecked: string
  }>({
    contextAuth: false,
    serverAuth: false,
    cookieAuth: false,
    lastChecked: new Date().toISOString(),
  })

  // Load recipes and check auth on component mount
  useEffect(() => {
    loadRecipes()
    checkUserAuth()
  }, [])

  // Update auth status when context changes
  useEffect(() => {
    setAuthStatus((prev) => ({
      ...prev,
      contextAuth: isAuthenticated,
      lastChecked: new Date().toISOString(),
    }))

    if (user) {
      setUserInfo({
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
    } else {
      setUserInfo(null)
    }
  }, [user, isAuthenticated])

  const checkUserAuth = async () => {
    console.log("🔍 [DELETION-TEST] Checking user authentication status...")

    try {
      // Check server-side auth
      const serverResponse = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      })

      const serverData = await serverResponse.json()
      console.log("🔍 [DELETION-TEST] Server auth response:", serverData)

      // Check cookie auth
      const cookieResponse = await fetch("/api/debug/auth", {
        credentials: "include",
        cache: "no-store",
      })

      const cookieData = await cookieResponse.json()
      console.log("🔍 [DELETION-TEST] Cookie auth response:", cookieData)

      setAuthStatus((prev) => ({
        ...prev,
        serverAuth: serverData.success && !!serverData.user,
        cookieAuth: cookieData.success && !!cookieData.serverAuthResult?.user,
        lastChecked: new Date().toISOString(),
      }))

      // Set user info from server response if available
      if (serverData.success && serverData.user) {
        setUserInfo(serverData.user)
      } else if (cookieData.success && cookieData.serverAuthResult?.user) {
        setUserInfo(cookieData.serverAuthResult.user)
      }
    } catch (error) {
      console.error("❌ [DELETION-TEST] Auth check failed:", error)
      setAuthStatus((prev) => ({
        ...prev,
        serverAuth: false,
        cookieAuth: false,
        lastChecked: new Date().toISOString(),
      }))
    }
  }

  const loadRecipes = async () => {
    try {
      console.log("🔍 [DELETION-TEST] Loading recipes...")
      const response = await fetch("/api/recipes", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ [DELETION-TEST] Recipes loaded:", data.recipes?.length || 0)
        setRecipes(data.recipes || [])
      } else {
        console.log("❌ [DELETION-TEST] Failed to load recipes:", response.status)
      }
    } catch (error) {
      console.error("❌ [DELETION-TEST] Failed to load recipes:", error)
    }
  }

  const testAuthentication = async () => {
    setLoading(true)
    setAuthResult(null)
    setAuthDetails(null)

    try {
      console.log("🔍 [DELETION-TEST] Testing authentication...")
      const response = await fetch("/api/debug/auth", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()
      console.log("🔍 [DELETION-TEST] Auth test response:", data)

      if (data.success) {
        setAuthResult({
          success: true,
          message: "Authentication successful",
          data: data,
        })
        setAuthDetails(data)

        // Update user info from auth test
        if (data.serverAuthResult?.user) {
          setUserInfo(data.serverAuthResult.user)
        }
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
      console.error("❌ [DELETION-TEST] Auth test error:", error)
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
      console.log("🔍 [DELETION-TEST] Testing database connection...")
      const response = await fetch("/api/test/database-connection", {
        method: "GET",
        credentials: "include",
      })

      const data = await response.json()
      console.log("🔍 [DELETION-TEST] Database test response:", data)

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
      console.error("❌ [DELETION-TEST] Database test error:", error)
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
      console.log("🗑️ [DELETION-TEST] Testing full recipe deletion...")
      console.log("🗑️ Recipe ID:", selectedRecipeId)
      console.log("🗑️ Reason:", deletionReason)
      console.log("🗑️ Current user:", userInfo)

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
      console.log("🗑️ [DELETION-TEST] Deletion test response:", data)

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
      console.error("❌ [DELETION-TEST] Deletion test error:", error)
      setDeletionResult({
        success: false,
        message: "Deletion test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshAuth = async () => {
    setLoading(true)
    try {
      await checkAuth()
      await checkUserAuth()
      setMessage("✅ Authentication status refreshed")
    } catch (error) {
      setMessage("❌ Failed to refresh authentication")
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

  const getAuthStatusIcon = (status: boolean) => {
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800"
      case "admin":
        return "bg-red-100 text-red-800"
      case "moderator":
        return "bg-blue-100 text-blue-800"
      case "user":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Recipe Deletion Debug Tool</h1>
        <p className="text-gray-600">
          Comprehensive testing tool for debugging recipe deletion authentication and database operations.
        </p>
      </div>

      {/* User Authentication Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Authentication Status
          </CardTitle>
          <CardDescription>Current login status and user information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              {getAuthStatusIcon(authStatus.contextAuth)}
              <div>
                <p className="font-medium text-sm">Context Auth</p>
                <p className="text-xs text-gray-600">
                  {authStatus.contextAuth ? "Authenticated" : "Not authenticated"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              {getAuthStatusIcon(authStatus.serverAuth)}
              <div>
                <p className="font-medium text-sm">Server Auth</p>
                <p className="text-xs text-gray-600">{authStatus.serverAuth ? "Valid session" : "No valid session"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              {getAuthStatusIcon(authStatus.cookieAuth)}
              <div>
                <p className="font-medium text-sm">Cookie Auth</p>
                <p className="text-xs text-gray-600">{authStatus.cookieAuth ? "Valid cookies" : "Invalid cookies"}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          {userInfo ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-green-800">Logged in as:</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Username:</span> {userInfo.username}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {userInfo.email}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Role:</span>
                  <Badge className={getRoleColor(userInfo.role)}>{userInfo.role}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={userInfo.status === "active" ? "default" : "secondary"}>{userInfo.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Verified:</span>
                  {userInfo.is_verified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>{userInfo.is_verified ? "Yes" : "No"}</span>
                </div>
                <div>
                  <span className="font-medium">User ID:</span> {userInfo.id}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">Not logged in</p>
              </div>
              <p className="text-red-600 text-sm mt-1">
                You need to be logged in to test recipe deletion functionality.
              </p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button onClick={refreshAuth} disabled={loading} variant="outline" size="sm">
              🔄 Refresh Auth Status
            </Button>
            <Button onClick={checkUserAuth} disabled={loading} variant="outline" size="sm">
              🔍 Check Server Auth
            </Button>
          </div>

          <p className="text-xs text-gray-500">Last checked: {new Date(authStatus.lastChecked).toLocaleString()}</p>
        </CardContent>
      </Card>

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
              disabled={loading || !selectedRecipeId || !userInfo}
              className="bg-red-600 hover:bg-red-700"
            >
              🗑️ Run Full Deletion Test
            </Button>
          </div>

          {!userInfo && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">⚠️ You must be logged in to test recipe deletion functionality.</p>
            </div>
          )}

          {message && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
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
