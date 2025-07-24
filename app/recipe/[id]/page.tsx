"use client"

import { Star, Clock, Users, MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

interface Recipe {
  id: number
  title: string
  description: string
  author_id: number
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  rating: number
  review_count: number
  view_count: number
  ingredients: Array<{ ingredient: string; amount: string; unit: string }>
  instructions: Array<{ instruction: string; step_number: number }>
  tags: string[]
  created_at: string
}

interface Comment {
  id: number
  content: string
  user_id: number
  username: string
  avatar_url?: string
  created_at: string
}

export default function RecipePage() {
  const params = useParams()
  const recipeId = params.id as string
  const { user, isAuthenticated } = useAuth()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isSubmittingRating, setIsSubmittingRating] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipe()
    loadComments()
    if (isAuthenticated) {
      loadUserRating()
    }
  }, [recipeId, isAuthenticated])

  const loadRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`)
      if (response.ok) {
        const data = await response.json()
        setRecipe(data.recipe)
      }
    } catch (error) {
      console.error("Failed to load recipe:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments?recipeId=${recipeId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error("Failed to load comments:", error)
    }
  }

  const loadUserRating = async () => {
    try {
      const response = await fetch(`/api/ratings?recipeId=${recipeId}`)
      if (response.ok) {
        const data = await response.json()
        setUserRating(data.rating)
      }
    } catch (error) {
      console.error("Failed to load user rating:", error)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: Number.parseInt(recipeId),
          content: newComment.trim(),
        }),
      })

      const data = await response.json()
      if (data.success) {
        if (data.comment) {
          // Comment was approved automatically
          setComments((prev) => [data.comment, ...prev])
        }
        setMessage(data.message)
        setNewComment("")
      } else {
        setMessage(data.error || "Failed to submit comment")
      }
    } catch (error) {
      setMessage("Failed to submit comment")
    } finally {
      setIsSubmittingComment(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const handleRating = async (rating: number) => {
    if (isSubmittingRating) return

    setIsSubmittingRating(true)
    try {
      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: Number.parseInt(recipeId),
          rating,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setUserRating(rating)
        setMessage("Rating submitted successfully!")
        // Update recipe rating
        if (recipe) {
          setRecipe({
            ...recipe,
            rating: data.avgRating,
            review_count: data.totalRatings,
          })
        }
      } else {
        setMessage(data.error || "Failed to submit rating")
      }
    } catch (error) {
      setMessage("Failed to submit rating")
    } finally {
      setIsSubmittingRating(false)
      setTimeout(() => setMessage(""), 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe not found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-orange-600">
              JTDRecipe
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    Profile
                  </Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Recipe Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <Image
                src={recipe.image_url || "/placeholder.svg?height=400&width=600"}
                alt={recipe.title}
                width={600}
                height={400}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
            </div>

            <div className="md:w-1/2">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{recipe.category}</Badge>
                <Badge variant="outline">{recipe.difficulty}</Badge>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{recipe.title}</h1>

              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt={recipe.author_username} />
                  <AvatarFallback>{recipe.author_username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{recipe.author_username}</p>
                  <p className="text-sm text-gray-500">Recipe creator</p>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.floor(recipe.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{recipe.rating.toFixed(1)}</span>
                <span className="text-gray-500">({recipe.review_count} ratings)</span>
              </div>

              {/* User Rating Section */}
              {isAuthenticated && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Rate this recipe:</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        disabled={isSubmittingRating}
                        className="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= (hoverRating || userRating || 0)
                              ? "fill-orange-400 text-orange-400"
                              : "text-gray-300 hover:text-orange-400"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {userRating && <p className="text-sm text-gray-600 mt-1">Your rating: {userRating} stars</p>}
                </div>
              )}

              <p className="text-gray-600 mb-6">{recipe.description}</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                  <p className="text-sm font-medium">Prep: {recipe.prep_time_minutes}min</p>
                  <p className="text-sm font-medium">Cook: {recipe.cook_time_minutes}min</p>
                </div>
                <div className="text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                  <p className="text-sm font-medium">Servings</p>
                  <p className="text-sm font-medium">{recipe.servings}</p>
                </div>
                <div className="text-center">
                  <Star className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                  <p className="text-sm font-medium">Difficulty</p>
                  <p className="text-sm font-medium">{recipe.difficulty}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">
                        {ingredient.amount} {ingredient.unit} {ingredient.ingredient}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {recipe.instructions
                    .sort((a, b) => a.step_number - b.step_number)
                    .map((instruction, index) => (
                      <li key={index} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {instruction.step_number}
                        </span>
                        <p className="text-sm leading-relaxed pt-1">{instruction.instruction}</p>
                      </li>
                    ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment Form */}
            {isAuthenticated ? (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this recipe..."
                  className="mb-3"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSubmitComment} disabled={!newComment.trim() || isSubmittingComment} size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-4 border rounded-lg bg-gray-50 text-center">
                <p className="text-gray-600">
                  <Link href="/login" className="text-orange-600 hover:underline">
                    Login
                  </Link>{" "}
                  to leave a comment
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={comment.avatar_url || "/placeholder.svg?height=32&width=32"}
                        alt={comment.username}
                      />
                      <AvatarFallback>{comment.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.username}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
