"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChefHat, Plus, AlertCircle, CheckCircle, RefreshCw, Send, Eye, EyeOff, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ApiResponse {
  success: boolean
  error?: string
  details?: string
  data?: any
  message?: string
  timestamp?: string
  stack?: string
}

interface CurrentUser {
  id: string
  username: string
  email: string
  role: string
  status: string
  is_verified: boolean
}

export default function TestRecipeSubmission() {
  // Form state
  const [title, setTitle] = useState("Test Recipe")
  const [description, setDescription] = useState("A delicious test recipe for debugging")
  const [category, setCategory] = useState("dessert")
  const [difficulty, setDifficulty] = useState("easy")
  const [prepTime, setPrepTime] = useState("15")
  const [cookTime, setCookTime] = useState("30")
  const [servings, setServings] = useState("4")
  const [imageUrl, setImageUrl] = useState("")

  // Single-line format arrays with '+' button functionality
  const [ingredients, setIngredients] = useState<string[]>(["2 cups flour", "1 cup sugar", "3 eggs"])
  const [instructions, setInstructions] = useState<string[]>([
    "Mix dry ingredients in a large bowl",
    "Add wet ingredients and stir until combined",
    "Bake for 30 minutes at 350°F",
  ])
  const [tags, setTags] = useState<string[]>(["test", "debug"])

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showDebugInfo, setShowDebugInfo] = useState(true)

  // Debug state
  const [lastRequest, setLastRequest] = useState<any>(null)
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null)
  const [rawResponse, setRawResponse] = useState("")
  const [requestTimestamp, setRequestTimestamp] = useState("")
  const [networkError, setNetworkError] = useState<string | null>(null)

  // Check authentication on component mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    setAuthLoading(true)
    setNetworkError(null)

    try {
      console.log("🔄 [TEST-FORM] Checking authentication status...")

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        console.error("❌ [TEST-FORM] Auth check failed with status:", response.status)
        setCurrentUser(null)
        return
      }

      const responseText = await response.text()

      try {
        const data = JSON.parse(responseText)
        console.log("✅ [TEST-FORM] Auth check response:", data)

        if (data.success && data.user) {
          setCurrentUser(data.user)
          console.log("✅ [TEST-FORM] User authenticated:", data.user.username)
        } else {
          setCurrentUser(null)
          console.log("❌ [TEST-FORM] User not authenticated")
        }
      } catch (parseError) {
        console.error("❌ [TEST-FORM] Failed to parse auth response:", parseError)
        console.error("Raw response:", responseText)
        setCurrentUser(null)
      }
    } catch (error) {
      console.error("❌ [TEST-FORM] Auth check network error:", error)
      setCurrentUser(null)
      setNetworkError(error instanceof Error ? error.message : "Unknown network error")
    } finally {
      setAuthLoading(false)
    }
  }

  // Ingredient management functions
  const addIngredient = () => {
    setIngredients([...ingredients, ""])
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients]
    updated[index] = value
    setIngredients(updated)
  }

  // Instruction management functions
  const addInstruction = () => {
    setInstructions([...instructions, ""])
  }

  const removeInstruction = (index: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index))
    }
  }

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions]
    updated[index] = value
    setInstructions(updated)
  }

  // Tag management functions
  const addTag = (tagValue: string) => {
    if (tagValue.trim() && !tags.includes(tagValue.trim())) {
      setTags([...tags, tagValue.trim()])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const submitRecipe = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in first to submit recipes",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setRequestTimestamp(new Date().toISOString())
    setNetworkError(null)
    setLastResponse(null)
    setRawResponse("")

    // Clean and validate arrays
    const cleanIngredients = ingredients.filter((ing) => ing.trim()).map((ing) => ing.trim())
    const cleanInstructions = instructions.filter((inst) => inst.trim()).map((inst) => inst.trim())
    const cleanTags = tags.filter((tag) => tag.trim()).map((tag) => tag.trim())

    if (cleanIngredients.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one ingredient is required",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (cleanInstructions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one instruction is required",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const requestData = {
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      prep_time_minutes: Number.parseInt(prepTime) || 15,
      cook_time_minutes: Number.parseInt(cookTime) || 30,
      servings: Number.parseInt(servings) || 4,
      image_url: imageUrl.trim() || undefined,
      ingredients: cleanIngredients, // Array of strings
      instructions: cleanInstructions, // Array of strings
      tags: cleanTags, // Array of strings
    }

    console.log("🔄 [TEST-FORM] Submitting recipe with JSONB arrays:", requestData)
    setLastRequest(requestData)

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
        body: JSON.stringify(requestData), // Proper JSON stringification
      })

      console.log("🔄 [TEST-FORM] Response status:", response.status)

      let responseText
      try {
        responseText = await response.text()
        setRawResponse(responseText)
        console.log("📥 [TEST-FORM] Raw response:", responseText)
      } catch (textError) {
        console.error("❌ [TEST-FORM] Error getting response text:", textError)
        setRawResponse(
          `Error getting response text: ${textError instanceof Error ? textError.message : "Unknown error"}`,
        )
        throw textError
      }

      let responseData: ApiResponse
      try {
        responseData = JSON.parse(responseText)
        console.log("✅ [TEST-FORM] Parsed response:", responseData)
      } catch (parseError) {
        console.error("❌ [TEST-FORM] JSON parse error:", parseError)
        responseData = {
          success: false,
          error: "JSON Parse Error",
          details: `Failed to parse response as JSON: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
        }
      }

      setLastResponse(responseData)

      if (responseData.success) {
        toast({
          title: "Success!",
          description: responseData.message || "Recipe submitted successfully",
        })
        console.log("✅ [TEST-FORM] Recipe submission successful")
      } else {
        toast({
          title: "Submission Failed",
          description: responseData.error || "Unknown error occurred",
          variant: "destructive",
        })
        console.error("❌ [TEST-FORM] Recipe submission failed:", responseData.error)
      }
    } catch (error) {
      console.error("❌ [TEST-FORM] Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"
      setNetworkError(errorMessage)

      const errorResponse: ApiResponse = {
        success: false,
        error: "Network Error",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      }

      setLastResponse(errorResponse)
      setRawResponse(`Network Error: ${errorMessage}`)

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormDisabled = !currentUser || authLoading || isSubmitting

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-orange-600" />
          Test Recipe Submission (JSONB Arrays)
        </h1>
        <p className="text-gray-600">Debug and test the recipe submission API with proper JSONB array handling</p>
      </div>

      {/* Authentication Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          {authLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking authentication...</span>
            </div>
          ) : currentUser ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Authenticated as: {currentUser.username}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{currentUser.role}</Badge>
                <Badge variant={currentUser.status === "active" ? "default" : "destructive"}>
                  {currentUser.status}
                </Badge>
                {currentUser.is_verified && <Badge variant="secondary">Verified</Badge>}
              </div>
              <p className="text-sm text-gray-600">Email: {currentUser.email}</p>
              <p className="text-sm text-gray-600">User ID: {currentUser.id}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-600">Not authenticated</span>
              </div>
              <p className="text-sm text-gray-600">Please log in to submit recipes</p>

              {networkError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Network error: {networkError}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Button onClick={checkAuthStatus} variant="outline" size="sm" disabled={authLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${authLoading ? "animate-spin" : ""}`} />
              Refresh Auth
            </Button>
            {!currentUser && (
              <Button onClick={() => (window.location.href = "/login")} size="sm">
                Go to Login
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Form (Single-Line Format)</CardTitle>
              <CardDescription>
                {isFormDisabled
                  ? "Form disabled - authentication required"
                  : "Fill out the recipe details with '+' buttons for arrays"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="Recipe title"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory} disabled={isFormDisabled}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appetizer">Appetizer</SelectItem>
                      <SelectItem value="main-course">Main Course</SelectItem>
                      <SelectItem value="dessert">Dessert</SelectItem>
                      <SelectItem value="beverage">Beverage</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="Brief description of the recipe"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select value={difficulty} onValueChange={setDifficulty} disabled={isFormDisabled}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="prep-time">Prep Time *</Label>
                  <Input
                    id="prep-time"
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="Minutes"
                  />
                </div>
                <div>
                  <Label htmlFor="cook-time">Cook Time *</Label>
                  <Input
                    id="cook-time"
                    type="number"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="Minutes"
                  />
                </div>
                <div>
                  <Label htmlFor="servings">Servings *</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    disabled={isFormDisabled}
                    placeholder="Number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image-url">Image URL (optional)</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isFormDisabled}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Ingredients - Single Line Format */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ingredients * ({ingredients.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient} disabled={isFormDisabled}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Ingredient
                  </Button>
                </div>
                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm font-medium text-orange-600">
                        {index + 1}
                      </div>
                      <Input
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        disabled={isFormDisabled}
                        placeholder={`Ingredient ${index + 1} (e.g., "2 cups flour")`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                        disabled={isFormDisabled || ingredients.length <= 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions - Single Line Format */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Instructions * ({instructions.length})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addInstruction} disabled={isFormDisabled}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 mt-1">
                        {index + 1}
                      </div>
                      <Textarea
                        value={instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        disabled={isFormDisabled}
                        placeholder={`Step ${index + 1} (e.g., "Mix dry ingredients in a large bowl")`}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeInstruction(index)}
                        disabled={isFormDisabled || instructions.length <= 1}
                        className="mt-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags - Badge Format */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tags (optional) ({tags.length})</Label>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (e.g., 'vegetarian', 'quick')"
                    disabled={isFormDisabled}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const target = e.target as HTMLInputElement
                        addTag(target.value)
                        target.value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      addTag(input.value)
                      input.value = ""
                    }}
                    disabled={isFormDisabled}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={submitRecipe} disabled={isFormDisabled} className="w-full" size="lg">
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Recipe (JSONB Arrays)
                  </>
                )}
              </Button>

              {isFormDisabled && !authLoading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {!currentUser ? "Please log in to submit recipes" : "Form is currently disabled"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Debug Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Debug Information
                <Button variant="ghost" size="sm" onClick={() => setShowDebugInfo(!showDebugInfo)}>
                  {showDebugInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {showDebugInfo && (
              <CardContent>
                <Tabs defaultValue="current-user" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="current-user">User</TabsTrigger>
                    <TabsTrigger value="request">Request</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>

                  <TabsContent value="current-user" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Current User Data</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {JSON.stringify(currentUser, null, 2) || "No user data available"}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="request" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Last Request Data (JSONB Arrays)</h4>
                      {requestTimestamp && <p className="text-xs text-gray-500">Sent: {requestTimestamp}</p>}
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {lastRequest ? JSON.stringify(lastRequest, null, 2) : "No request sent yet"}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="response" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">API Response</h4>
                      {lastResponse && (
                        <div className="flex items-center gap-2 mb-2">
                          {lastResponse.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              lastResponse.success ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {lastResponse.success ? "Success" : "Error"}
                          </span>
                          {lastResponse.timestamp && (
                            <span className="text-xs text-gray-500">
                              {new Date(lastResponse.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      )}
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {lastResponse ? JSON.stringify(lastResponse, null, 2) : "No response yet"}
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Raw Response Text</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {rawResponse || "No raw response yet"}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>

          {/* Array Format Info */}
          <Card className="border-green-300">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-700 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                JSONB Array Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Database Schema:</strong>
                </p>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb
                  <br />
                  instructions JSONB NOT NULL DEFAULT '[]'::jsonb
                  <br />
                  tags JSONB DEFAULT '[]'::jsonb
                </code>
                <p>
                  <strong>Frontend sends:</strong>
                </p>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  ingredients: ["2 cups flour", "1 cup sugar"]
                  <br />
                  instructions: ["Mix ingredients", "Bake for 30 min"]
                  <br />
                  tags: ["dessert", "easy"]
                </code>
                <p>
                  <strong>Content-Type:</strong> application/json
                </p>
                <p>
                  <strong>Body:</strong> JSON.stringify(requestData)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTitle("Quick Test Recipe")
                  setDescription("Auto-generated test recipe with JSONB arrays")
                  setIngredients(["1 cup test ingredient", "2 tbsp test spice", "Salt to taste"])
                  setInstructions(["Mix all ingredients in a bowl", "Cook until done", "Serve immediately"])
                  setTags(["test", "debug", "jsonb"])
                }}
                disabled={isFormDisabled}
                className="w-full"
              >
                Fill Test Data (JSONB)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLastRequest(null)
                  setLastResponse(null)
                  setRawResponse("")
                  setRequestTimestamp("")
                  setNetworkError(null)
                }}
                className="w-full"
              >
                Clear Debug Data
              </Button>

              <Button variant="outline" size="sm" onClick={() => window.open("/admin", "_blank")} className="w-full">
                Open Admin Panel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
