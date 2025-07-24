"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface FlaggedComment {
  id: number
  content: string
  status: string
  is_flagged: boolean
  flag_reason: string
  flagged_at: string
  created_at: string
  author_username: string
  recipe_title: string
  recipe_id: number
  flagged_by_username: string
}

export default function FlaggedCommentsPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [flaggedComments, setFlaggedComments] = useState<FlaggedComment[]>([])
  const [loading, setLoading] = useState(true)
  const [moderatingId, setModeratingId] = useState<number | null>(null)
  const [moderationReason, setModerationReason] = useState("")

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "owner")) {
      fetchFlaggedComments()
    }
  }, [user])

  const fetchFlaggedComments = async () => {
    try {
      const response = await fetch("/api/admin/comments/flagged", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setFlaggedComments(data.flaggedComments)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch flagged comments",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching flagged comments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch flagged comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const moderateComment = async (commentId: number, action: "approve" | "reject" | "remove") => {
    setModeratingId(commentId)

    try {
      const response = await fetch("/api/admin/comments/flagged", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          commentId,
          action,
          reason: moderationReason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        })

        // Remove the comment from the list if it was moderated
        setFlaggedComments((prev) => prev.filter((comment) => comment.id !== commentId))
        setModerationReason("")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to moderate comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error moderating comment:", error)
      toast({
        title: "Error",
        description: "Failed to moderate comment",
        variant: "destructive",
      })
    } finally {
      setModeratingId(null)
    }
  }

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading flagged comments...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Flagged Comments</h1>
        <p className="text-muted-foreground mt-2">Review and moderate comments that have been flagged by users</p>
      </div>

      {flaggedComments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Flagged Comments</h3>
              <p className="text-muted-foreground">There are currently no flagged comments to review.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {flaggedComments.map((comment) => (
            <Card key={comment.id} className="border-orange-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Flagged Comment #{comment.id}
                    </CardTitle>
                    <CardDescription>
                      On recipe: <strong>{comment.recipe_title}</strong>
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">Flagged</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Comment Content:</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p>{comment.content}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Author:</strong> {comment.author_username}
                  </div>
                  <div>
                    <strong>Flagged by:</strong> {comment.flagged_by_username}
                  </div>
                  <div>
                    <strong>Posted:</strong> {format(new Date(comment.created_at), "PPp")}
                  </div>
                  <div>
                    <strong>Flagged:</strong> {format(new Date(comment.flagged_at), "PPp")}
                  </div>
                </div>

                {comment.flag_reason && (
                  <div>
                    <h4 className="font-semibold mb-2">Flag Reason:</h4>
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                      <p className="text-red-800">{comment.flag_reason}</p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Moderation Reason (Optional):</h4>
                  <Textarea
                    placeholder="Add a reason for your moderation decision..."
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    className="mb-4"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => moderateComment(comment.id, "approve")}
                    disabled={moderatingId === comment.id}
                    variant="default"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => moderateComment(comment.id, "reject")}
                    disabled={moderatingId === comment.id}
                    variant="secondary"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => moderateComment(comment.id, "remove")}
                    disabled={moderatingId === comment.id}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
