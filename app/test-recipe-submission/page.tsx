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
import { Plus, Trash2, Clock, Users, ChefHat } from "lucide-react"

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

export default function TestRecipeSubmission() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [response, setResponse] = useState<any>(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setResponse(null)
    setRawResponse("")
    setRequestData(null)

    try {
      // Prepare request data
      const requestBody = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        prep_time_minutes: Number.parseInt(formData.prep_time_minutes),
        cook_time_minutes: Number.parseInt(formData.cook_time_minutes),
        servings: Number.parseInt(formData.servings),
        image_url: formData.image_url,
        ingredients: formData.ingredients.filter((item) => item.trim().length > 0),
        instructions: formData.instructions.filter((item) => item.trim().length > 0),
        tags: formData.tags.filter((item) => item.trim().length > 0),
      }

      setRequestData(requestBody)
      console.log("📤 [SUBMIT] Sending request:", requestBody)

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const rawText = await response.text()
      setRawResponse(rawText)
      console.log("📥 [SUBMIT] Raw response:", rawText)

      let parsedResponse
      try {
        parsedResponse = JSON.parse(rawText)
      } catch (parseError) {
        parsedResponse = { error: "Failed to parse response", rawText }
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data: parsedResponse,
      })

      if (response.ok && parsedResponse.success) {
        console.log("✅ [SUBMIT] Recipe submitted successfully:", parsedResponse)
      } else {
        console.log("❌ [SUBMIT] Recipe submission failed:", parsedResponse)
      }
    } catch (error) {
      console.error("❌ [SUBMIT] Submission error:", error)
      setResponse({
        status: 0,
        statusText: "Network Error",
        ok: false,
        data: { error: error instanceof Error ? error.message : "Unknown error" },
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
            <div className="text-center">Loading...</div>
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
            Recipe Submission Test
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
                <AlertDescription>
                  ✅ Authenticated as <strong>{user.username}</strong> ({user.email}) - Role:{" "}
                  <Badge variant="outline">{user.role}</Badge>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertDescription>
                  ❌ Not authenticated. Please{" "}
                  <a href="/login" className="underline">
                    login
                  </a>{" "}
                  first.
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

              {/* Debug Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Debug Information</h3>

                <Tabs defaultValue="request" className="w-full">
                  <TabsList>
                    <TabsTrigger value="request">Request Data</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="raw">Raw Response</TabsTrigger>
                    <TabsTrigger value="schema">JSONB Format</TabsTrigger>
                  </TabsList>

                  <TabsContent value="request">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Request Body (JSON)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
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
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
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
                        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                          {rawResponse || "No raw response yet"}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schema">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Database Schema (JSONB)</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium">Ingredients Column:</h4>
                          <code className="bg-gray-100 p-2 rounded block text-xs">
                            ingredients JSONB NOT NULL DEFAULT '[]'::jsonb
                          </code>
                          <p className="text-sm text-gray-600 mt-1">
                            Stored as: ["2 cups flour", "1 tsp salt", "2 eggs"]
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium">Instructions Column:</h4>
                          <code className="bg-gray-100 p-2 rounded block text-xs">
                            instructions JSONB NOT NULL DEFAULT '[]'::jsonb
                          </code>
                          <p className="text-sm text-gray-600 mt-1">
                            Stored as: ["Preheat oven to 350°F", "Mix ingredients", "Bake for 30 minutes"]
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium">Tags Column:</h4>
                          <code className="bg-gray-100 p-2 rounded block text-xs">tags JSONB DEFAULT '[]'::jsonb</code>
                          <p className="text-sm text-gray-600 mt-1">Stored as: ["dessert", "chocolate", "baking"]</p>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <h4 className="font-medium text-blue-800">Processing Notes:</h4>
                          <ul className="text-sm text-blue-700 mt-1 space-y-1">
                            <li>• Arrays are converted to JSONB using JSON.stringify()</li>
                            <li>• Empty items are filtered out before storage</li>
                            <li>• Items are trimmed of whitespace</li>
                            <li>• Database uses PostgreSQL JSONB for efficient querying</li>
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
