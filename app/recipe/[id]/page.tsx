"use client"

import { Star, Clock, Users, Heart, Edit, CheckCircle, X, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { getRecipeById } from "@/lib/recipes"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { RecipeShare } from "@/components/recipe-share"
import { SocialMeta } from "@/components/social-meta"
import { secureDB, type SecureUser, type SecureRecipe } from "@/lib/secure-database"

interface Comment {
  id: string
  recipe_id: string
  user_id: string
  username: string
  avatar?: string
  content: string
  created_at: string
  updated_at: string
}

export default function RecipePage() {
  const params = useParams()
  const recipeId = params.id as string
  const { user, isAuthenticated, toggleFavorite, rateRecipe, getUserRating, isFavorited } = useAuth()

  const [recipe, setRecipe] = useState<any>(null)
  const [secureRecipe, setSecureRecipe] = useState<SecureRecipe | null>(null)
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [moderationAction, setModerationAction] = useState<"approve" | "reject">("approve")
  const [moderationReason, setModerationReason] = useState("")
  const [message, setMessage] = useState("")
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    prep_time_minutes: 0,
    cook_time_minutes: 0,
    servings: 0,
    ingredients: [] as string[],
    instructions: [] as string[],
  })

  const canModerate = (currentUser: SecureUser | null) => {
    if (!currentUser) return false
    return ["moderator", "admin", "owner"].includes(currentUser.role)
  }

  useEffect(() => {
    loadRecipeData()
    if (isAuthenticated) {
      loadComments()
    }
  }, [recipeId, isAuthenticated])

  const loadRecipeData = async () => {
    // Try to get from secure database first (for pending recipes)
    if (isAuthenticated && user) {
      try {
        const secureUser = secureDB.getUserById(user.id)
        if (secureUser && canModerate(secureUser)) {
          const allRecipes = secureDB.getAllRecipes(user.id)
          const foundSecureRecipe = allRecipes.find((r) => r.id === recipeId)
          if (foundSecureRecipe) {
            setSecureRecipe(foundSecureRecipe)
            setEditForm({
              title: foundSecureRecipe.title,
              description: foundSecureRecipe.description || "",
              category: foundSecureRecipe.category,
              difficulty: foundSecureRecipe.difficulty,
              prep_time_minutes: foundSecureRecipe.prep_time_minutes,
              cook_time_minutes: foundSecureRecipe.cook_time_minutes,
              servings: foundSecureRecipe.servings,
              ingredients: foundSecureRecipe.ingredients?.map((i) => i.ingredient) || [],
              instructions: foundSecureRecipe.instructions?.map((i) => i.instruction) || [],
            })
            return
          }
        }
      } catch (error) {
        console.log("No secure recipe found, trying regular recipe")
      }
    }

    // Fallback to regular recipe system
    const recipeData = getRecipeById(recipeId)
    setRecipe(recipeData)

    if (isAuthenticated && recipeData) {
      setUserRating(getUserRating(recipeId))
      setIsFavorite(isFavorited(recipeId))
    }
  }

  const loadComments = () => {
    // Load comments from localStorage
    const storedComments = localStorage.getItem(`recipe_comments_${recipeId}`)
    if (storedComments) {
      setComments(JSON.parse(storedComments))
    }
  }

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) return
    const newFavoriteStatus = toggleFavorite(recipeId)
    setIsFavorite(newFavoriteStatus)
  }

  const handleRating = (rating: number) => {
    if (!isAuthenticated) return
    rateRecipe(recipeId, rating)
    setUserRating(rating)
    setIsRatingDialogOpen(false)
  }

  const handleModerationAction = async () => {
    if (!user || !secureRecipe) return

    try {
      const success = await secureDB.moderateRecipe(user.id, secureRecipe.id, moderationAction, moderationReason)
      if (success) {
        setMessage(`Recipe ${moderationAction}d successfully`)
        setIsModerationDialogOpen(false)
        setModerationReason("")
        // Reload recipe data
        loadRecipeData()
      } else {
        setMessage("Failed to moderate recipe")
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message)
    }

    setTimeout(() => setMessage(""), 3000)
  }

  const handleEditRecipe = async () => {
    if (!user || !secureRecipe) return

    try {
      const updates = {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        difficulty: editForm.difficulty,
        prep_time_minutes: editForm.prep_time_minutes,
        cook_time_minutes: editForm.cook_time_minutes,
        servings: editForm.servings,
        // Note: In a real implementation, you'd also update ingredients and instructions
      }

      const success = await secureDB.updateRecipe(user.id, secureRecipe.id, updates)
      if (success) {
        setMessage("Recipe updated successfully")
        setIsEditDialogOpen(false)
        loadRecipeData()
      } else {
        setMessage("Failed to update recipe")
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message)
    }

    setTimeout(() => setMessage(""), 3000)
  }

  const handleAddComment = async () => {
    if (!isAuthenticated || !user || !newComment.trim()) return

    setIsSubmittingComment(true)

    const comment: Comment = {
      id: Date.now().toString(),
      recipe_id: recipeId,
      user_id: user.id,
      username: user.username,
      avatar: user.avatar,
      content: newComment.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const updatedComments = [...comments, comment]
    setComments(updatedComments)
    localStorage.setItem(`recipe_comments_${recipeId}`, JSON.stringify(updatedComments))

    setNewComment("")
    setIsSubmittingComment(false)
    setMessage("Comment added successfully")
    setTimeout(() => setMessage(""), 3000)
  }

  const displayRecipe = secureRecipe || recipe

  if (!displayRecipe) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Recipe not found</div>
  }

  const reviews = [
    {
      id: 1,
      user: "CookieLover23",
      avatar: "/placeholder.svg?height=32&width=32",
      rating: 5,
      comment: "These turned out amazing! My family loved them.",
      date: "2024-01-20",
    },
    {
      id: 2,
      user: "HomeBaker",
      avatar: "/placeholder.svg?height=32&width=32",
      rating: 5,
      comment: "Perfect recipe, followed exactly and they were delicious!",
      date: "2024-01-18",
    },
  ]

  return (
    <>
      <SocialMeta
        title={displayRecipe.title}
        description={displayRecipe.description}
        image={displayRecipe.image || displayRecipe.image_url}
        url={`${typeof window !== "undefined" ? window.location.href : ""}`}
        author={displayRecipe.author || displayRecipe.author_username}
      />
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

          {/* Moderation Status Alert */}
          {secureRecipe && secureRecipe.moderation_status === "pending" && (
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="flex items-center justify-between">
                <span>This recipe is pending approval and is only visible to moderators.</span>
                {isAuthenticated && user && canModerate(secureDB.getUserById(user.id)) && (
                  <div className="flex gap-2">
                    <Dialog open={isModerationDialogOpen} onOpenChange={setIsModerationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setModerationAction("approve")}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    <Dialog open={isModerationDialogOpen} onOpenChange={setIsModerationDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setModerationAction("reject")}>
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Recipe Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <Image
                  src={displayRecipe.image || displayRecipe.image_url || "/placeholder.svg"}
                  alt={displayRecipe.title}
                  width={600}
                  height={400}
                  className="w-full h-64 md:h-80 object-cover rounded-lg"
                />
              </div>

              <div className="md:w-1/2">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{displayRecipe.category}</Badge>
                  <Badge variant="outline">{displayRecipe.difficulty}</Badge>
                  {secureRecipe && (
                    <Badge
                      className={
                        secureRecipe.moderation_status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : secureRecipe.moderation_status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }
                    >
                      {secureRecipe.moderation_status}
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">{displayRecipe.title}</h1>

                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={displayRecipe.authorAvatar || "/placeholder.svg"}
                      alt={displayRecipe.author || displayRecipe.author_username}
                    />
                    <AvatarFallback>{(displayRecipe.author || displayRecipe.author_username)?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{displayRecipe.author || displayRecipe.author_username}</p>
                    <p className="text-sm text-gray-500">Recipe creator</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.floor(displayRecipe.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-medium">{displayRecipe.rating || 0}</span>
                  <span className="text-gray-500">
                    ({displayRecipe.reviews || displayRecipe.review_count || 0} reviews)
                  </span>
                </div>

                {userRating && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">Your rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= userRating ? "fill-orange-400 text-orange-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-gray-600 mb-6">{displayRecipe.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-sm font-medium">
                      Prep: {displayRecipe.prepTime || `${displayRecipe.prep_time_minutes}min`}
                    </p>
                    <p className="text-sm font-medium">
                      Cook: {displayRecipe.cookTime || `${displayRecipe.cook_time_minutes}min`}
                    </p>
                  </div>
                  <div className="text-center">
                    <Users className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-sm font-medium">Servings</p>
                    <p className="text-sm font-medium">{displayRecipe.servings}</p>
                  </div>
                  <div className="text-center">
                    <Star className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-sm font-medium">Difficulty</p>
                    <p className="text-sm font-medium">{displayRecipe.difficulty}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isAuthenticated ? (
                    <>
                      <Button
                        className="flex-1"
                        variant={isFavorite ? "default" : "outline"}
                        onClick={handleFavoriteToggle}
                      >
                        <Heart className={`w-4 h-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                        {isFavorite ? "Favorited" : "Favorite"}
                      </Button>
                      <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Star className="w-4 h-4 mr-2" />
                            {userRating ? "Update Rating" : "Rate"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Rate this recipe</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center gap-2 py-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRating(star)}
                                className="p-1 hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    star <= (userRating || 0)
                                      ? "fill-orange-400 text-orange-400"
                                      : "text-gray-300 hover:text-orange-400"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  ) : (
                    <Link href="/login" className="flex-1">
                      <Button className="w-full">
                        <Heart className="w-4 h-4 mr-2" />
                        Login to Save
                      </Button>
                    </Link>
                  )}
                  <RecipeShare
                    recipe={{
                      id: recipeId,
                      title: displayRecipe.title,
                      description: displayRecipe.description,
                      image: displayRecipe.image || displayRecipe.image_url,
                      author: displayRecipe.author || displayRecipe.author_username,
                    }}
                  />
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
                    {(displayRecipe.ingredients || []).map((ingredient: any, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <input type="checkbox" className="mt-1" />
                        <span className="text-sm">
                          {typeof ingredient === "string" ? ingredient : ingredient.ingredient}
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
                    {(displayRecipe.instructions || []).map((instruction: any, index: number) => (
                      <li key={index} className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-relaxed pt-1">
                          {typeof instruction === "string" ? instruction : instruction.instruction}
                        </p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Comments Section - Only show for approved recipes */}
          {(!secureRecipe || secureRecipe.moderation_status === "approved") && (
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
                    <Label htmlFor="comment" className="text-sm font-medium">
                      Add a comment
                    </Label>
                    <Textarea
                      id="comment"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts about this recipe..."
                      className="mt-2"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <Button onClick={handleAddComment} disabled={!newComment.trim() || isSubmittingComment} size="sm">
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
                          <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.username} />
                          <AvatarFallback>{comment.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{comment.username}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))}

                  {/* Legacy Reviews */}
                  {reviews.map((review) => (
                    <div key={review.id}>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.avatar || "/placeholder.svg"} alt={review.user} />
                          <AvatarFallback>{review.user[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{review.user}</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{review.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{review.comment}</p>
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
          )}
        </div>

        {/* Moderation Dialog */}
        <Dialog open={isModerationDialogOpen} onOpenChange={setIsModerationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{moderationAction === "approve" ? "Approve Recipe" : "Reject Recipe"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Recipe: {displayRecipe.title}</Label>
              </div>
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder={`Enter reason for ${moderationAction}ing this recipe...`}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModerationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleModerationAction}>
                  {moderationAction === "approve" ? "Approve" : "Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Recipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-difficulty">Difficulty</Label>
                  <Input
                    id="edit-difficulty"
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-prep">Prep Time (min)</Label>
                  <Input
                    id="edit-prep"
                    type="number"
                    value={editForm.prep_time_minutes}
                    onChange={(e) => setEditForm({ ...editForm, prep_time_minutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cook">Cook Time (min)</Label>
                  <Input
                    id="edit-cook"
                    type="number"
                    value={editForm.cook_time_minutes}
                    onChange={(e) => setEditForm({ ...editForm, cook_time_minutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-servings">Servings</Label>
                  <Input
                    id="edit-servings"
                    type="number"
                    value={editForm.servings}
                    onChange={(e) => setEditForm({ ...editForm, servings: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditRecipe}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
