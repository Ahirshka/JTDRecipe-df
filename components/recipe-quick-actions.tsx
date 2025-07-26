"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MoreVertical, Edit, Trash2, Flag, Eye } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"

interface Recipe {
  id: string
  title: string
  author_username: string
  author_id: string
}

interface RecipeQuickActionsProps {
  recipe: Recipe
  onRecipeDeleted?: () => void
}

export function RecipeQuickActions({ recipe, onRecipeDeleted }: RecipeQuickActionsProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState("")

  // Check if user can moderate (admin/owner/moderator)
  const canModerate = isAuthenticated && user && ["admin", "owner", "moderator"].includes(user.role)

  // Check if user is the author
  const isAuthor = isAuthenticated && user && user.id === recipe.author_id

  if (!isAuthenticated || !user) {
    return null
  }

  const handleDeleteRecipe = () => {
    console.log("🗑️ [RECIPE-QUICK-ACTIONS] Opening delete dialog for recipe:", recipe.id)
    setDeleteReason("")
    setMessage("")
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    setProcessing(true)
    setMessage("")
    console.log("🔄 [RECIPE-QUICK-ACTIONS] Executing deletion:", {
      recipeId: recipe.id,
      reason: deleteReason,
    })

    try {
      const response = await fetch("/api/admin/recipes/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipeId: recipe.id,
          reason: deleteReason,
        }),
      })

      console.log("📡 [RECIPE-QUICK-ACTIONS] Delete response status:", response.status)

      const data = await response.json()
      console.log("📡 [RECIPE-QUICK-ACTIONS] Delete response data:", data)

      if (data.success) {
        console.log("✅ [RECIPE-QUICK-ACTIONS] Recipe deleted successfully")
        setDeleteDialogOpen(false)

        // Call callback if provided
        if (onRecipeDeleted) {
          onRecipeDeleted()
        }

        // Redirect to homepage
        router.push("/")
      } else {
        console.log("❌ [RECIPE-QUICK-ACTIONS] Failed to delete recipe:", data.error)
        setMessage(data.error || "Failed to delete recipe")
      }
    } catch (error) {
      console.error("❌ [RECIPE-QUICK-ACTIONS] Delete failed:", error)
      setMessage("Delete failed - network error")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/recipe/${recipe.id}`)}>
            <Eye className="w-4 h-4 mr-2" />
            View Recipe
          </DropdownMenuItem>

          {(isAuthor || canModerate) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/recipe/${recipe.id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Recipe
              </DropdownMenuItem>
            </>
          )}

          {canModerate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteRecipe} className="text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Recipe
              </DropdownMenuItem>
            </>
          )}

          {!canModerate && !isAuthor && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                <Flag className="w-4 h-4 mr-2" />
                Report Recipe
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">{recipe.title}</span>
              </div>
              <p className="text-sm text-red-700">by {recipe.author_username}</p>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ This action cannot be undone. The recipe and all associated data will be permanently deleted.
              </p>
            </div>

            {message && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="deleteReason">Reason for deletion (optional)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deleting this recipe..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteReason("")
                setMessage("")
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeDelete} disabled={processing}>
              {processing ? "Deleting..." : "Delete Recipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RecipeQuickActions
