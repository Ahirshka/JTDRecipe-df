"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, ChefHat, AlertCircle, CheckCircle, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Ingredient {
  ingredient: string
  amount: string
  unit: string
}

interface Instruction {
  instruction: string
  step_number: number
}

interface ApiResponse {
  success: boolean
  message?: string
  error?: string
  details?: string
  data?: any
  missingFields?: string[]
  stack?: string
  timestamp?: string
}

export default function TestRecipeSubmission() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [prepTime, setPrepTime] = useState("")
  const [cookTime, setCookTime] = useState("")
  const [servings, setServings] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ ingredient: "", amount: "", unit: "" }])
  const [instructions, setInstructions] = useState<Instruction[]>([{ instruction: "", step_number: 1 }])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [lastResponse, setLastResponse] = useState<ApiResponse | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const categories = [
    "Appetizers",
    "Main Dishes",
    "Side Dishes",
    "Desserts",
    "Beverages",
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snacks",
    "Salads",
    "Soups",
    "Pasta",
  ]

  const difficulties = ["Easy", "Medium", "Hard"]
  const units = ["cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "piece", "clove", "pinch", "whole"]

  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient: "", amount: "", unit: "" }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    setIngredients(updated)
  }

  const addInstruction = () => {
    setInstructions([...instructions, { instruction: "", step_number: instructions.length + 1 }])
  }

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index)
    const renumbered = updated.map((inst, i) => ({ ...inst, step_number: i + 1 }))
    setInstructions(renumbered)
  }

  const updateInstruction = (index: number, value: string) => {
    const updated = instructions.map((inst, i) => (i === index ? { ...inst, instruction: value } : inst))
    setInstructions(updated)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const fillSampleData = () => {
    setTitle("Test Recipe - Classic Chocolate Chip Cookies")
    setDescription(
      "Perfectly chewy chocolate chip cookies that everyone will love. These cookies have crispy edges and soft centers with plenty of chocolate chips in every bite. This is a test recipe to verify the submission system works correctly.",
    )
    setCategory("Desserts")
    setDifficulty("Easy")
    setPrepTime("15")
    setCookTime("12")
    setServings("24")
    setImageUrl("/placeholder.svg?height=300&width=400&text=Test+Chocolate+Chip+Cookies")

    setIngredients([
      { ingredient: "All-purpose flour", amount: "2.25", unit: "cup" },
      { ingredient: "Baking soda", amount: "1", unit: "tsp" },
      { ingredient: "Salt", amount: "1", unit: "tsp" },
      { ingredient: "Butter, softened", amount: "1", unit: "cup" },
      { ingredient: "Granulated sugar", amount: "0.75", unit: "cup" },
      { ingredient: "Brown sugar, packed", amount: "0.75", unit: "cup" },
      { ingredient: "Large eggs", amount: "2", unit: "piece" },
      { ingredient: "Vanilla extract", amount: "2", unit: "tsp" },
      { ingredient: "Chocolate chips", amount: "2", unit: "cup" },
    ])

    setInstructions([
      { instruction: "Preheat oven to 375°F (190°C). Line baking sheets with parchment paper.", step_number: 1 },
      { instruction: "In a medium bowl, whisk together flour, baking soda, and salt. Set aside.", step_number: 2 },
      {
        instruction:
          "In a large bowl, cream together softened butter and both sugars until light and fluffy, about 3-4 minutes.",
        step_number: 3,
      },
      { instruction: "Beat in eggs one at a time, then add vanilla extract.", step_number: 4 },
      { instruction: "Gradually mix in the flour mixture until just combined. Don't overmix.", step_number: 5 },
      { instruction: "Fold in chocolate chips until evenly distributed.", step_number: 6 },
      {
        instruction: "Drop rounded tablespoons of dough onto prepared baking sheets, spacing them 2 inches apart.",
        step_number: 7,
      },
      {
        instruction:
          "Bake for 9-12 minutes or until edges are golden brown but centers still look slightly underbaked.",
        step_number: 8,
      },
      {
        instruction: "Cool on baking sheet for 5 minutes, then transfer to a wire rack to cool completely.",
        step_number: 9,
      },
    ])

    setTags(["test", "cookies", "dessert", "chocolate", "baking", "easy", "family-friendly"])
  }

  const clearForm = () => {
    setTitle("")
    setDescription("")
    setCategory("")
    setDifficulty("")
    setPrepTime("")
    setCookTime("")
    setServings("")
    setImageUrl("")
    setIngredients([{ ingredient: "", amount: "", unit: "" }])
    setInstructions([{ instruction: "", step_number: 1 }])
    setTags([])
    setNewTag("")
    setLastResponse(null)
    setDebugInfo(null)
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!title.trim()) errors.push("Title is required")
    if (!category) errors.push("Category is required")
    if (!difficulty) errors.push("Difficulty is required")
    if (!prepTime || Number.parseInt(prepTime) <= 0) errors.push("Valid prep time is required")
    if (!cookTime || Number.parseInt(cookTime) <= 0) errors.push("Valid cook time is required")
    if (!servings || Number.parseInt(servings) <= 0) errors.push("Valid servings count is required")

    const validIngredients = ingredients.filter((ing) => ing.ingredient.trim() && ing.amount.trim())
    if (validIngredients.length === 0) errors.push("At least one complete ingredient is required")

    const validInstructions = instructions.filter((inst) => inst.instruction.trim())
    if (validInstructions.length === 0) errors.push("At least one instruction is required")

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setLastResponse(null)
    setDebugInfo(null)

    try {
      console.log("🔄 [TEST-FORM] Starting form submission...")

      // Client-side validation
      const validationErrors = validateForm()
      if (validationErrors.length > 0) {
        const errorMsg = `Validation failed: ${validationErrors.join(", ")}`
        console.log("❌ [TEST-FORM] Client validation failed:", validationErrors)

        setLastResponse({
          success: false,
          error: "Client-side validation failed",
          details: errorMsg,
          missingFields: validationErrors,
        })

        toast({
          title: "Validation Error",
          description: errorMsg,
          variant: "destructive",
        })
        return
      }

      // Filter valid data
      const validIngredients = ingredients.filter(
        (ing) => ing.ingredient.trim() && ing.amount.trim() && ing.unit.trim(),
      )
      const validInstructions = instructions.filter((inst) => inst.instruction.trim())

      // Prepare request data
      const requestData = {
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        prep_time_minutes: Number.parseInt(prepTime),
        cook_time_minutes: Number.parseInt(cookTime),
        servings: Number.parseInt(servings),
        image_url: imageUrl.trim() || undefined,
        ingredients: validIngredients,
        instructions: validInstructions,
        tags: tags.filter((tag) => tag.trim()),
      }

      console.log("📤 [TEST-FORM] Sending request data:", {
        ...requestData,
        ingredients_count: requestData.ingredients.length,
        instructions_count: requestData.instructions.length,
        tags_count: requestData.tags.length,
      })

      setDebugInfo({
        requestData,
        timestamp: new Date().toISOString(),
        validationPassed: true,
      })

      // Make API request
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("📥 [TEST-FORM] Response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      })

      // Handle response
      let result: ApiResponse
      const responseText = await response.text()

      console.log("📄 [TEST-FORM] Raw response text:", responseText)

      if (!responseText) {
        result = {
          success: false,
          error: "Empty response from server",
          details: "The server returned an empty response",
        }
      } else {
        try {
          result = JSON.parse(responseText)
          console.log("✅ [TEST-FORM] Parsed response:", result)
        } catch (parseError) {
          console.error("❌ [TEST-FORM] Failed to parse response JSON:", parseError)
          result = {
            success: false,
            error: "Invalid JSON response",
            details: `Failed to parse server response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
            stack: responseText.substring(0, 500), // First 500 chars of response
          }
        }
      }

      setLastResponse(result)

      if (result.success) {
        console.log("✅ [TEST-FORM] Recipe submitted successfully")
        toast({
          title: "Success!",
          description: result.message || "Recipe submitted successfully for moderation",
        })

        // Clear form on success
        clearForm()
      } else {
        console.log("❌ [TEST-FORM] Recipe submission failed:", result)
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to submit recipe",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [TEST-FORM] Network or unexpected error:", error)

      const errorResponse: ApiResponse = {
        success: false,
        error: "Network or client error",
        details: error instanceof Error ? error.message : "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      }

      setLastResponse(errorResponse)

      toast({
        title: "Network Error",
        description: "Failed to connect to server. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-6 h-6" />
                Test Recipe Submission
              </CardTitle>
              <CardDescription>
                Submit a test recipe to verify the submission system and admin moderation workflow
              </CardDescription>
              <div className="flex gap-2">
                <Button onClick={fillSampleData} variant="outline" size="sm">
                  Fill Sample Data
                </Button>
                <Button onClick={clearForm} variant="outline" size="sm">
                  Clear Form
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Recipe Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter recipe title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
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
                    placeholder="Describe your recipe..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((diff) => (
                          <SelectItem key={diff} value={diff}>
                            {diff}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prepTime">Prep Time (min) *</Label>
                    <Input
                      id="prepTime"
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="15"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cookTime">Cook Time (min) *</Label>
                    <Input
                      id="cookTime"
                      type="number"
                      value={cookTime}
                      onChange={(e) => setCookTime(e.target.value)}
                      placeholder="30"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="servings">Servings *</Label>
                    <Input
                      id="servings"
                      type="number"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                      placeholder="4"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Ingredients *</Label>
                    <Button type="button" onClick={addIngredient} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Ingredient
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Input
                            placeholder="Ingredient name"
                            value={ingredient.ingredient}
                            onChange={(e) => updateIngredient(index, "ingredient", e.target.value)}
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            placeholder="Amount"
                            value={ingredient.amount}
                            onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                          />
                        </div>
                        <div className="w-24">
                          <Select
                            value={ingredient.unit}
                            onValueChange={(value) => updateIngredient(index, "unit", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeIngredient(index)}
                          disabled={ingredients.length === 1}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Instructions *</Label>
                    <Button type="button" onClick={addInstruction} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Step
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                          {instruction.step_number}
                        </div>
                        <Textarea
                          placeholder={`Step ${instruction.step_number} instructions...`}
                          value={instruction.instruction}
                          onChange={(e) => updateInstruction(index, e.target.value)}
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInstruction(index)}
                          disabled={instructions.length === 1}
                          className="mt-1"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Submit Test Recipe"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info Column */}
        <div className="space-y-4">
          {/* Last Response */}
          {lastResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {lastResponse.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  API Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert variant={lastResponse.success ? "default" : "destructive"}>
                  <AlertDescription>
                    <strong>Status:</strong> {lastResponse.success ? "Success" : "Failed"}
                  </AlertDescription>
                </Alert>

                {lastResponse.message && (
                  <div>
                    <Label className="text-xs text-green-600">Message</Label>
                    <p className="text-sm bg-green-50 p-2 rounded border">{lastResponse.message}</p>
                  </div>
                )}

                {lastResponse.error && (
                  <div>
                    <Label className="text-xs text-red-600">Error</Label>
                    <p className="text-sm bg-red-50 p-2 rounded border">{lastResponse.error}</p>
                  </div>
                )}

                {lastResponse.details && (
                  <div>
                    <Label className="text-xs text-orange-600">Details</Label>
                    <p className="text-sm bg-orange-50 p-2 rounded border">{lastResponse.details}</p>
                  </div>
                )}

                {lastResponse.missingFields && lastResponse.missingFields.length > 0 && (
                  <div>
                    <Label className="text-xs text-red-600">Missing Fields</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lastResponse.missingFields.map((field) => (
                        <Badge key={field} variant="destructive" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {lastResponse.data && (
                  <div>
                    <Label className="text-xs text-blue-600">Response Data</Label>
                    <pre className="text-xs bg-blue-50 p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(lastResponse.data, null, 2)}
                    </pre>
                  </div>
                )}

                {lastResponse.stack && (
                  <div>
                    <Label className="text-xs text-gray-600">Stack/Raw Response</Label>
                    <pre className="text-xs bg-gray-50 p-2 rounded border overflow-auto max-h-32">
                      {lastResponse.stack}
                    </pre>
                  </div>
                )}

                {lastResponse.timestamp && (
                  <div>
                    <Label className="text-xs text-gray-500">Timestamp</Label>
                    <p className="text-xs text-gray-600">{lastResponse.timestamp}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-blue-500" />
                  Debug Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-blue-600">Request Data</Label>
                    <pre className="text-xs bg-blue-50 p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.requestData, null, 2)}
                    </pre>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <Label className="text-xs">Ingredients</Label>
                      <p className="bg-gray-50 p-1 rounded">{debugInfo.requestData?.ingredients?.length || 0}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Instructions</Label>
                      <p className="bg-gray-50 p-1 rounded">{debugInfo.requestData?.instructions?.length || 0}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Submitted At</Label>
                    <p className="text-xs text-gray-600">{debugInfo.timestamp}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>1. Click "Fill Sample Data" to populate the form</p>
              <p>2. Click "Submit Test Recipe" to test the API</p>
              <p>3. Check the API Response panel for detailed results</p>
              <p>4. Look for any JSON parsing errors or validation issues</p>
              <p>5. Check browser console for additional debugging info</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
