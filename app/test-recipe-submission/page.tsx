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
import { Plus, Minus, ChefHat } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Ingredient {
  ingredient: string
  amount: string
  unit: string
}

interface Instruction {
  instruction: string
  step_number: number
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
  const units = ["cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", "piece", "clove", "pinch"]

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
    // Renumber the remaining instructions
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
    setTitle("Classic Chocolate Chip Cookies")
    setDescription(
      "Perfectly chewy chocolate chip cookies that everyone will love. These cookies have crispy edges and soft centers with plenty of chocolate chips in every bite.",
    )
    setCategory("Desserts")
    setDifficulty("Easy")
    setPrepTime("15")
    setCookTime("12")
    setServings("24")
    setImageUrl("/placeholder.svg?height=300&width=400&text=Chocolate+Chip+Cookies")

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

    setTags(["cookies", "dessert", "chocolate", "baking", "easy", "family-friendly"])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate required fields
      if (!title || !category || !difficulty || !prepTime || !cookTime || !servings) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Filter out empty ingredients and instructions
      const validIngredients = ingredients.filter(
        (ing) => ing.ingredient.trim() && ing.amount.trim() && ing.unit.trim(),
      )
      const validInstructions = instructions.filter((inst) => inst.instruction.trim())

      if (validIngredients.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one ingredient",
          variant: "destructive",
        })
        return
      }

      if (validInstructions.length === 0) {
        toast({
          title: "Error",
          description: "Please add at least one instruction",
          variant: "destructive",
        })
        return
      }

      const recipeData = {
        title,
        description,
        category,
        difficulty,
        prep_time_minutes: Number.parseInt(prepTime),
        cook_time_minutes: Number.parseInt(cookTime),
        servings: Number.parseInt(servings),
        image_url: imageUrl || undefined,
        ingredients: validIngredients,
        instructions: validInstructions,
        tags,
      }

      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recipeData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success!",
          description: "Recipe submitted for moderation. It will appear on the site once approved.",
        })

        // Reset form
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
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to submit recipe",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description: "Failed to submit recipe",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-6 h-6" />
              Test Recipe Submission
            </CardTitle>
            <CardDescription>Submit a test recipe to demonstrate the admin moderation workflow</CardDescription>
            <Button onClick={fillSampleData} variant="outline" className="w-fit bg-transparent">
              Fill Sample Data
            </Button>
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
                {submitting ? "Submitting..." : "Submit Recipe for Moderation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
