"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, CheckCircle, XCircle, Calendar, User, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface PendingComment {
  id: number
  content: string
  user_id: number
  username: string
  avatar_url?: string
  recipe_id: number
  recipe_title: string
  created_at: string
  status: string
}

export default function CommentModerationPage() {
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([])
  const [loading, setLoading] = useState(true)
  const [moderating, setModerating] = useState<number | null>(null)
  const [selectedComment, setSelectedComment] = useState<PendingComment | null>(null)
  const [moderationReason, setModerationReason] = useState("")
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    loadPendingComments()
  }, [])

  const loadPendingComments = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/comments")
      if (response.ok) {
        const data = await response.json()
        setPendingComments(data.comments || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load pending comments",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load pending comments:", error)
      toast({
        title: "Error",
        description: "Failed to load pending comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const moderateComment = async (commentId: number, action: "approve" | "reject") => {
    try {
      setModerating(commentId)

      const response = await fetch("/api/admin/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          action,
          reason: moderationReason.trim() || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Comment ${action}d successfully`,
        })

        // Remove the moderated comment from the list
        setPendingComments((prev) => prev.filter((comment) => comment.id !== commentId))
        setModerationReason("")
        setViewDialogOpen(false)
        setSelectedComment(null)
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${action} comment`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Moderation error:", error)
      toast({
        title: "Error",
        description: `Failed to ${action} comment`,
        variant: "destructive",
      })
    } finally {
      setModerating(null)
    }
  }

  const openCommentDetails = (comment: PendingComment) => {
    setSelectedComment(comment)
    setModerationReason("")
    setViewDialogOpen(true)
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
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-orange-600">
                JTDRecipe
              </Link>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  Back to Admin
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Comment Moderation</CardTitle>
              <CardDescription>Loading pending comments...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            </CardContent>
          </Card>
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
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comment Moderation Queue
              </CardTitle>
              <CardDescription>
                {pendingComments.length} comment{pendingComments.length !== 1 ? "s" : ""} awaiting your review
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingComments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                  <p className="text-gray-600">No comments pending moderation at the moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingComments.map((comment) => (
                    <Card key={comment.id} className="border-l-4 border-l-yellow-400">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage
                                  src={comment.avatar_url || "/placeholder.svg?height=32&width=32"}
                                  alt={comment.username}
                                />
                                <AvatarFallback>{comment.username[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{comment.username}</p>
                                <p className="text-sm text-gray-500">
                                  on{" "}
                                  <Link
                                    href={`/recipe/${comment.recipe_id}`}
                                    className="text-orange-600 hover:underline"
                                  >
                                    {comment.recipe_title}
                                  </Link>
                                </p>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                              <p className="text-gray-800">{comment.content}</p>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(comment.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>User ID: {comment.user_id}</span>
                              </div>
                              <Badge variant="secondary">{comment.status}</Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button onClick={() => openCommentDetails(comment)} variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-1" />
                                View Details
                              </Button>

                              <Button
                                onClick={() => moderateComment(comment.id, "approve")}
                                disabled={moderating === comment.id}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {moderating === comment.id ? "Approving..." : "Approve"}
                              </Button>

                              <Button
                                onClick={() => moderateComment(comment.id, "reject")}
                                disabled={moderating === comment.id}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                {moderating === comment.id ? "Rejecting..." : "Reject"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comment Details Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comment Review
              </DialogTitle>
              <DialogDescription>Review this comment and decide whether to approve or reject it.</DialogDescription>
            </DialogHeader>

            {selectedComment && (
              <div className="space-y-6">
                {/* Comment Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={selectedComment.avatar_url || "/placeholder.svg?height=40&width=40"}
                        alt={selectedComment.username}
                      />
                      <AvatarFallback>{selectedComment.username[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedComment.username}</p>
                      <p className="text-sm text-gray-500">Commented on {formatDate(selectedComment.created_at)}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Recipe:</Label>
                    <p className="text-sm text-gray-600">
                      <Link href={`/recipe/${selectedComment.recipe_id}`} className="text-orange-600 hover:underline">
                        {selectedComment.recipe_title}
                      </Link>
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Comment Content:</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800">{selectedComment.content}</p>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="moderation-reason">Moderation Notes (Optional)</Label>
                    <Textarea
                      id="moderation-reason"
                      placeholder="Add any notes about this moderation decision..."
                      value={moderationReason}
                      onChange={(e) => setModerationReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => moderateComment(selectedComment.id, "approve")}
                      disabled={moderating === selectedComment.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {moderating === selectedComment.id ? "Approving..." : "Approve Comment"}
                    </Button>

                    <Button
                      onClick={() => moderateComment(selectedComment.id, "reject")}
                      disabled={moderating === selectedComment.id}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {moderating === selectedComment.id ? "Rejecting..." : "Reject Comment"}
                    </Button>

                    <Button onClick={() => setViewDialogOpen(false)} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
