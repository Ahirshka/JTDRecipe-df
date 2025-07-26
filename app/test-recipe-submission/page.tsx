"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Clock, Users, ChefHat, CheckCircle, XCircle } from "lucide-react"

interface RecipeFormData {
  title: string
  description: string
  category: string
  difficulty: string
  prep_time_minutes: string
  cook_time_minutes: string
  servings: string
  image_url: string
  ingredients: string[]
  instructions: string[]
  tags: string[]
}

interface ApiResponse {
  status: number
  statusText: string
  ok: boolean
  data: any
}

export default function TestRecipeSubmission() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [rawResponse, setRawResponse] = useState<string>("")
  const [requestData, setRequestData] = useState<any>(null)

  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    prep_time_minutes: "",
    cook_time_minutes: "",
    servings: "",
    image_url: "",
    ingredients: [""],
    instructions: [""],
    tags: [""],
  })

  // Check authentication status
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
        console.log("✅ [AUTH] User authenticated:", userData.user)
      } else {
        console.log("❌ [AUTH] User not authenticated")
        setUser(null)
      }
    } catch (error) {
      console.error("❌ [AUTH] Auth check error:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const fillTestData = () => {
    setFormData({
      title: "Test Chocolate Chip Cookies",
      description: "Delicious homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.",
      category: "Desserts",
      difficulty: "Easy",
      prep_time_minutes: "15",
      cook_time_minutes: "12",
      servings: "24",
      image_url: "https://example.com/cookies.jpg",
      ingredients: [
        "2 1/4 cups all-purpose flour",
        "1 tsp baking soda",
        "1 tsp salt",
        "1 cup butter, softened",
        "3/4 cup granulated sugar",
        "3/4 cup brown sugar",
        "2 large eggs",
        "2 tsp vanilla extract",
        "2 cups chocolate chips",
      ],
      instructions: [
        "Preheat oven to 375°F (190°C)",
        "Mix flour, baking soda, and salt in a bowl",
        "Cream butter and sugars until fluffy",
        "Beat in eggs and vanilla",
        "Gradually mix in flour mixture",
        "Stir in chocolate chips",
        "Drop rounded tablespoons onto ungreased baking sheets",
        "Bake 9-11 minutes until golden brown",
        "Cool on baking sheet for 2 minutes, then transfer to wire rack",
      ],
      tags: ["cookies", "dessert", "chocolate", "baking"],
    })
  }

  const addArrayItem = (field: "ingredients" | "instructions" | "tags") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }))
  }

  const removeArrayItem = (field: "ingredients" | "instructions" | "tags", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const updateArrayItem = (field: "ingredients" | "instructions" | "tags", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!formData.title.trim()) errors.push("Title is required")
    if (!formData.category.trim()) errors.push("Category is required")
    if (!formData.difficulty.trim()) errors.push("Difficulty is required")

    const prepTime = Number.parseInt(formData.prep_time_minutes)
    if (isNaN(prepTime) || prepTime < 0) errors.push("Prep time must be a valid positive number")

    const cookTime = Number.parseInt(formData.cook_time_minutes)
    if (isNaN(cookTime) || cookTime < 0) errors.push("Cook time must be a valid positive number")

    const servings = Number.parseInt(formData.servings)
    if (isNaN(servings) || servings < 1) errors.push("Servings must be a valid positive number")

    const validIngredients = formData.ingredients.filter((item) => item.trim().length > 0)
    if (validIngredients.length === 0) errors.push("At least one ingredient is required")

    const validInstructions = formData.instructions.filter((item) => item.trim().length > 0)
    if (validInstructions.length === 0) errors.push("At least one instruction is required")

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setResponse(null)
    setRawResponse("")
    setRequestData(null)

    try {
      // Validate form
      const validationErrors = validateForm()
      if (validationErrors.length > 0) {
        setResponse({
          status: 400,
          statusText: "Validation Error",
          ok: false,
          data: {
            success: false,
            error: "Form validation failed",
            details: validationErrors,
          },
        })
        return
      }

      // Prepare request data with exact types expected by API
      const requestBody = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim(),
        difficulty: formData.difficulty.trim(),
        prep_time_minutes: Number.parseInt(formData.prep_time_minutes),
        cook_time_minutes: Number.parseInt(formData.cook_time_minutes),
        servings: Number.parseInt(formData.servings),
        image_url: formData.image_url.trim() || undefined,
        ingredients: formData.ingredients.filter((item) => item.trim().length > 0).map((item) => item.trim()),
        instructions: formData.instructions.filter((item) => item.trim().length > 0).map((item) => item.trim()),
        tags: formData.tags.filter((item) => item.trim().length > 0).map((item) => item.trim()),
      }

      setRequestData(requestBody)
      console.log("📤 [SUBMIT] Sending request:", requestBody)

      // Make API request with proper headers
      const apiResponse = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include", // Include cookies for session
        body: JSON.stringify(requestBody),
      })

      // Get raw response text first
      const rawText = await apiResponse.text()
      setRawResponse(rawText)
      console.log("📥 [SUBMIT] Raw response:", rawText)

      // Try to parse JSON
      let parsedResponse
      try {
        parsedResponse = rawText ? JSON.parse(rawText) : { error: "Empty response" }
      } catch (parseError) {
        console.error("❌ [SUBMIT] JSON parse error:", parseError)
        parsedResponse = {
          success: false,
          error: "Failed to parse server response",
          rawText: rawText.substring(0, 500),
          parseError: parseError instanceof Error ? parseError.message : "Unknown parse error",
        }
      }

      setResponse({
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        ok: apiResponse.ok,
        data: parsedResponse,
      })

      if (apiResponse.ok && parsedResponse.success) {
        console.log("✅ [SUBMIT] Recipe submitted successfully:", parsedResponse)
      } else {
        console.log("❌ [SUBMIT] Recipe submission failed:", parsedResponse)
      }
    } catch (error) {
      console.error("❌ [SUBMIT] Network/submission error:", error)
      setResponse({
        status: 0,
        statusText: "Network Error",
        ok: false,
        data: {
          success: false,
          error: error instanceof Error ? error.message : "Unknown network error",
          type: "network_error",
        },
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading authentication status...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Recipe Submission Test & Debug
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Authentication Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Authentication Status
            </h3>
            {user ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ✅ Authenticated as <strong>{user.username}</strong> ({user.email}) - Role:{" "}
                  <Badge variant="outline">{user.role}</Badge>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  ❌ Not authenticated. Please{" "}
                  <a href="/login" className="underline">
                    login
                  </a>{" "}
                  first to test recipe submission.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator className="my-6" />

          {user && (
            <>
              {/* Recipe Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex gap-4 mb-6">
                  <Button type="button" onClick={fillTestData} variant="outline">
                    Fill Test Data
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Recipe"}
                  </Button>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="Recipe title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category *</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Desserts, Main Course"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Difficulty *</label>
                    <Input
                      value={formData.difficulty}
                      onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value }))}
                      placeholder="Easy, Medium, Hard"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                </div>

                {/* Times and Servings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Prep Time (minutes) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.prep_time_minutes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, prep_time_minutes: e.target.value }))}
                      placeholder="15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Cook Time (minutes) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.cook_time_minutes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cook_time_minutes: e.target.value }))}
                      placeholder="30"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Servings *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.servings}
                      onChange={(e) => setFormData((prev) => ({ ...prev, servings: e.target.value }))}
                      placeholder="4"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the recipe"
                    rows={3}
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block text-sm font-medium mb-2">Ingredients * (JSONB Array)</label>
                  <div className="space-y-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-sm text-gray-500 w-8 pt-2">{index + 1}.</span>
                        <Input
                          value={ingredient}
                          onChange={(e) => updateArrayItem("ingredients", index, e.target.value)}
                          placeholder="e.g., 2 cups flour"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem("ingredients", index)}
                          disabled={formData.ingredients.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("ingredients")}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Ingredient
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium mb-2">Instructions * (JSONB Array)</label>
                  <div className="space-y-2">
                    {formData.instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-sm text-gray-500 w-8 pt-2">{index + 1}.</span>
                        <Textarea
                          value={instruction}
                          onChange={(e) => updateArrayItem("instructions", index, e.target.value)}
                          placeholder="Describe this step"
                          className="flex-1"
                          rows={2}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem("instructions", index)}
                          disabled={formData.instructions.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("instructions")}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Instruction
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (JSONB Array)</label>
                  <div className="space-y-2">
                    {formData.tags.map((tag, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-sm text-gray-500 w-8 pt-2">{index + 1}.</span>
                        <Input
                          value={tag}
                          onChange={(e) => updateArrayItem("tags", index, e.target.value)}
                          placeholder="e.g., dessert"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeArrayItem("tags", index)}
                          disabled={formData.tags.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem("tags")}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Tag
                    </Button>
                  </div>
                </div>
              </form>

              <Separator className="my-6" />

              {/* Response Status */}
              {response && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Submission Result</h3>
                  <Alert variant={response.ok ? "default" : "destructive"}>
                    {response.ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <AlertDescription>
                      <div className="space-y-1">
                        <div>
                          <strong>Status:</strong> {response.status} {response.statusText}
                        </div>
                        {response.data?.success ? (
                          <div className="text-green-600">
                            ✅ {response.data.message}
                            {response.data.recipeId && (
                              <div className="text-sm mt-1">Recipe ID: {response.data.recipeId}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-red-600">
                            ❌ {response.data?.error || "Unknown error"}
                            {response.data?.details && (
                              <div className="text-sm mt-1">
                                Details:{" "}
                                {Array.isArray(response.data.details)
                                  ? response.data.details.join(", ")
                                  : JSON.stringify(response.data.details)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Debug Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Debug Information</h3>

                <Tabs defaultValue="request" className="w-full">
                  <TabsList>
                    <TabsTrigger value="request">Request Data</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="raw">Raw Response</TabsTrigger>
                    <TabsTrigger value="schema">Database Schema</TabsTrigger>
                  </TabsList>

                  <TabsContent value="request">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Request Body (JSON)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                          {requestData ? JSON.stringify(requestData, null, 2) : "No request data yet"}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="response">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Parsed Response</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                          {response ? JSON.stringify(response, null, 2) : "No response yet"}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="raw">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Raw Response Text</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                          {rawResponse || "No raw response yet"}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schema">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Database Schema & JSONB Format</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium">Recipe Table Schema:</h4>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {`CREATE TABLE recipes (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  author_id INTEGER NOT NULL,
  author_username VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes >= 0),
  cook_time_minutes INTEGER NOT NULL CHECK (cook_time_minutes >= 0),
  servings INTEGER NOT NULL CHECK (servings > 0),
  image_url TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  moderation_notes TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  search_vector TSVECTOR
);`}
                          </pre>
                        </div>

                        <div>
                          <h4 className="font-medium">JSONB Array Examples:</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Ingredients:</strong>
                              <code className="bg-gray-100 p-1 rounded block text-xs mt-1">
                                ["2 cups flour", "1 tsp salt", "2 eggs"]
                              </code>
                            </div>
                            <div>
                              <strong>Instructions:</strong>
                              <code className="bg-gray-100 p-1 rounded block text-xs mt-1">
                                ["Preheat oven to 350°F", "Mix ingredients", "Bake for 30 minutes"]
                              </code>
                            </div>
                            <div>
                              <strong>Tags:</strong>
                              <code className="bg-gray-100 p-1 rounded block text-xs mt-1">
                                ["dessert", "chocolate", "baking"]
                              </code>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <h4 className="font-medium text-blue-800">API Processing:</h4>
                          <ul className="text-sm text-blue-700 mt-1 space-y-1">
                            <li>• Arrays are validated and filtered for empty items</li>
                            <li>• Items are trimmed of whitespace</li>
                            <li>• JSON.stringify() converts arrays to JSONB format</li>
                            <li>• Database uses PostgreSQL JSONB for efficient querying</li>
                            <li>• Explicit ::jsonb casting ensures proper type conversion</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
