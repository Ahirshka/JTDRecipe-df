"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"
import { createRecipe } from "@/lib/recipe-actions"

const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Appetizers",
  "Desserts",
  "Snacks",
  "Beverages",
  "Salads",
  "Soups",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Quick & Easy",
  "Healthy",
  "Comfort Food",
]

const difficulties = ["Easy", "Medium", "Hard"]

export default function AddRecipePage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    prepTime: "",
    cookTime: "",
    servings: "",
    imageUrl: "",
  })

  const [ingredients, setIngredients] = useState([{ ingredient: "", amount: "", unit: "" }])
  const [instructions, setInstructions] = useState([{ instruction: "", step_number: 1 }])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Login Required</h2>
            <p className="text-gray-600 mb-4">You need to be logged in to add recipes.</p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { ingredient: "", amount: "", unit: "" }])
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    setIngredients(updated)
  }

  const addInstruction = () => {
    setInstructions([...instructions, { instruction: "", step_number: instructions.length + 1 }])
  }

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index)
    // Renumber the steps
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.category || !formData.difficulty) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      if (ingredients.some((ing) => !ing.ingredient)) {
        toast({
          title: "Missing Ingredients",
          description: "Please fill in all ingredient names.",
          variant: "destructive",
        })
        return
      }

      if (instructions.some((inst) => !inst.instruction)) {
        toast({
          title: "Missing Instructions",
          description: "Please fill in all instruction steps.",
          variant: "destructive",
        })
        return
      }

      // Create recipe object
      const recipeData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        prep_time_minutes: Number.parseInt(formData.prepTime) || 0,
        cook_time_minutes: Number.parseInt(formData.cookTime) || 0,
        servings: Number.parseInt(formData.servings) || 1,
        image_url: formData.imageUrl || undefined,
        ingredients: ingredients.filter((ing) => ing.ingredient.trim()),
        instructions: instructions
          .filter((inst) => inst.instruction.trim())
          .map((inst, index) => ({
            instruction: inst.instruction,
            step_number: index + 1,
          })),
        tags: tags,
      }

      // Submit recipe
      const result = await createRecipe(recipeData)

      if (result.success) {
        toast({
          title: "Recipe Submitted!",
          description:
            "Your recipe has been submitted for review. It will appear on the site once approved by our moderators.",
        })

        // Redirect to homepage
        router.push("/")
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "There was an error submitting your recipe. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting recipe:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your recipe. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Recipe</h1>
          <p className="text-gray-600 mt-2">Share your favorite recipe with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Recipe Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter recipe title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your recipe"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((difficulty) => (
                        <SelectItem key={difficulty} value={difficulty}>
                          {difficulty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    placeholder="4"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prepTime">Prep Time (minutes)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={formData.prepTime}
                    onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                    placeholder="15"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="cookTime">Cook Time (minutes)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    value={formData.cookTime}
                    onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                    placeholder="30"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/recipe-image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Ingredient *</Label>
                    <Input
                      value={ingredient.ingredient}
                      onChange={(e) => updateIngredient(index, "ingredient", e.target.value)}
                      placeholder="e.g., Flour"
                      required
                    />
                  </div>
                  <div className="w-24">
                    <Label>Amount</Label>
                    <Input
                      value={ingredient.amount}
                      onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                      placeholder="2"
                    />
                  </div>
                  <div className="w-24">
                    <Label>Unit</Label>
                    <Input
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                      placeholder="cups"
                    />
                  </div>
                  {ingredients.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeIngredient(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addIngredient} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="w-12 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-semibold mt-1">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={instruction.instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      placeholder="Describe this step..."
                      rows={2}
                      required
                    />
                  </div>
                  {instructions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeInstruction(index)}
                      className="mt-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addInstruction} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Step
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Recipe"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
