"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Users, Ban, CheckCircle, Clock, Search, Eye, UserX, ChefHat, Trash2, XCircle } from "lucide-react"
import { secureDB, type SecureUser, type SecureRecipe, type UserRole } from "@/lib/secure-database"
import { toast } from "@/hooks/use-toast"
import { hasPermission, canModerateUser, ROLE_HIERARCHY } from "@/lib/auth"

interface AdminDashboardProps {
  currentUser: SecureUser
}

interface Recipe {
  id: string
  title: string
  description?: string
  author_username: string
  category: string
  difficulty: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  image_url?: string
  moderation_status: string
  created_at: string
}

export function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const [users, setUsers] = useState<SecureUser[]>([])
  const [recipes, setRecipes] = useState<SecureRecipe[]>([])
  const [filteredUsers, setFilteredUsers] = useState<SecureUser[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<SecureRecipe[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<SecureUser | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<SecureRecipe | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<string>("")
  const [actionReason, setActionReason] = useState("")
  const [suspensionDays, setSuspensionDays] = useState("7")
  const [newRole, setNewRole] = useState<UserRole>("user")
  const [message, setMessage] = useState("")
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [moderatingId, setModeratingId] = useState<string | null>(null)
  const [moderationNotes, setModerationNotes] = useState("")

  useEffect(() => {
    loadData()
    loadPendingRecipes()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, userSearchTerm, filterRole, filterStatus])

  useEffect(() => {
    filterRecipes()
  }, [recipes, recipeSearchTerm])

  const loadData = async () => {
    try {
      const allUsers = await secureDB.getAllUsers(currentUser.id)
      const allRecipes = await secureDB.getAllRecipes(currentUser.id)
      setUsers(allUsers)
      setRecipes(allRecipes)
    } catch (error) {
      setMessage("Error loading data: " + (error as Error).message)
    }
  }

  const loadPendingRecipes = async () => {
    try {
      const response = await fetch("/api/admin/pending-recipes")
      if (response.ok) {
        const data = await response.json()
        setPendingRecipes(data.recipes || [])
      }
    } catch (error) {
      console.error("Failed to load pending recipes:", error)
      toast({
        title: "Error",
        description: "Failed to load pending recipes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      const matchesRole = filterRole === "all" || user.role === filterRole
      const matchesStatus = filterStatus === "all" || user.status === filterStatus

      return matchesSearch && matchesRole && matchesStatus
    })

    setFilteredUsers(filtered)
  }

  const filterRecipes = () => {
    const filtered = recipes.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
        recipe.author_username?.toLowerCase().includes(recipeSearchTerm.toLowerCase())

      return matchesSearch
    })

    setFilteredRecipes(filtered)
  }

  const handleUserAction = async (action: string, user: SecureUser) => {
    setSelectedUser(user)
    setActionType(action)
    setActionReason("")
    setSuspensionDays("7")
    setNewRole(user.role)
    setIsActionDialogOpen(true)
  }

  const handleRecipeAction = async (action: string, recipe: SecureRecipe) => {
    setSelectedRecipe(recipe)
    setActionType(action)
    setActionReason("")
    setIsRecipeDialogOpen(true)
  }

  const executeUserAction = async () => {
    if (!selectedUser) return

    try {
      let success = false

      switch (actionType) {
        case "suspend":
          success = await secureDB.suspendUser(
            currentUser.id,
            selectedUser.id,
            actionReason,
            Number.parseInt(suspensionDays),
          )
          break
        case "ban":
          success = await secureDB.banUser(currentUser.id, selectedUser.id, actionReason)
          break
        case "changeRole":
          success = await secureDB.changeUserRole(currentUser.id, selectedUser.id, newRole)
          break
      }

      if (success) {
        setMessage(`User action completed successfully`)
        loadData()
        setIsActionDialogOpen(false)
      } else {
        setMessage("User action failed")
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message)
    }

    setTimeout(() => setMessage(""), 3000)
  }

  const executeRecipeAction = async () => {
    if (!selectedRecipe) return

    try {
      let success = false

      switch (actionType) {
        case "approve":
          success = await secureDB.moderateRecipe(currentUser.id, selectedRecipe.id, "approved", actionReason)
          break
        case "reject":
          success = await secureDB.moderateRecipe(currentUser.id, selectedRecipe.id, "rejected", actionReason)
          break
        case "delete":
          success = await secureDB.deleteRecipe(currentUser.id, selectedRecipe.id)
          break
      }

      if (success) {
        setMessage(`Recipe action completed successfully`)
        loadData()
        setIsRecipeDialogOpen(false)
      } else {
        setMessage("Recipe action failed")
      }
    } catch (error) {
      setMessage("Error: " + (error as Error).message)
    }

    setTimeout(() => setMessage(""), 3000)
  }

  const canModerate = (targetUser: SecureUser) => {
    if (!currentUser?.role || !targetUser?.role) {
      return false
    }
    return canModerateUser(currentUser.role, targetUser.role)
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800"
      case "admin":
        return "bg-red-100 text-red-800"
      case "moderator":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "suspended":
        return "bg-yellow-100 text-yellow-800"
      case "banned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getModerationBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleModeration = async (recipeId: string, status: "approved" | "rejected") => {
    setModeratingId(recipeId)

    try {
      const response = await fetch("/api/admin/moderate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipeId,
          status,
          notes: moderationNotes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: `Recipe ${status} successfully`,
        })
        setPendingRecipes(pendingRecipes.filter((recipe) => recipe.id !== recipeId))
        setModerationNotes("")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to moderate recipe",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Moderation error:", error)
      toast({
        title: "Error",
        description: "Failed to moderate recipe",
        variant: "destructive",
      })
    } finally {
      setModeratingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    suspendedUsers: users.filter((u) => u.status === "suspended").length,
    bannedUsers: users.filter((u) => u.status === "banned").length,
    totalRecipes: recipes.length,
    pendingRecipes: pendingRecipes.length,
    approvedRecipes: recipes.filter((r) => r.moderation_status === "approved").length,
    rejectedRecipes: recipes.filter((r) => r.moderation_status === "rejected").length,
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRecipes}</div>
            <p className="text-xs text-muted-foreground">Recipes awaiting moderation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipes}</div>
            <p className="text-xs text-muted-foreground">Approved recipes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Active user accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Recipes */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Recipe Reviews</CardTitle>
          <CardDescription>Review and moderate user-submitted recipes</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRecipes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
              <p className="text-gray-600">No recipes pending review at the moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingRecipes.map((recipe) => (
                <div key={recipe.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{recipe.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {recipe.author_username}</p>
                      {recipe.description && <p className="text-gray-700 mb-2">{recipe.description}</p>}
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge variant="outline">{recipe.category}</Badge>
                        <Badge variant="outline">{recipe.difficulty}</Badge>
                        <Badge variant="outline">{recipe.prep_time_minutes + recipe.cook_time_minutes} min total</Badge>
                        <Badge variant="outline">{recipe.servings} servings</Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(recipe.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {recipe.image_url && (
                      <img
                        src={recipe.image_url || "/placeholder.svg"}
                        alt={recipe.title}
                        className="w-24 h-24 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${recipe.id}`}>Moderation Notes (optional)</Label>
                    <Textarea
                      id={`notes-${recipe.id}`}
                      value={moderationNotes}
                      onChange={(e) => setModerationNotes(e.target.value)}
                      placeholder="Add any notes about this recipe..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleModeration(recipe.id, "approved")}
                      disabled={moderatingId === recipe.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleModeration(recipe.id, "rejected")}
                      disabled={moderatingId === recipe.id}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management Tab */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="recipes">Recipe Management</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{user.username}</h3>
                          {user.email_verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                          <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-gray-600">
                        <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                        {user.last_login_at && <p>Last login: {new Date(user.last_login_at).toLocaleDateString()}</p>}
                      </div>

                      {canModerate(user) && (
                        <div className="flex gap-1">
                          {user.status !== "banned" && (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction("ban", user)}>
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}

                          {user.status !== "suspended" && (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction("suspend", user)}>
                              <UserX className="w-4 h-4" />
                            </Button>
                          )}

                          {currentUser.role === "owner" && (
                            <Button size="sm" variant="outline" onClick={() => handleUserAction("changeRole", user)}>
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search recipes..."
                      value={recipeSearchTerm}
                      onChange={(e) => setRecipeSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ChefHat className="w-8 h-8 text-gray-400" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{recipe.title}</h3>
                          <Badge className={getModerationBadgeColor(recipe.moderation_status)}>
                            {recipe.moderation_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">by {recipe.author_username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{recipe.category}</Badge>
                          <Badge variant="outline">{recipe.difficulty}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-gray-600">
                        <p>Created: {new Date(recipe.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="flex gap-1">
                        {recipe.moderation_status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleRecipeAction("approve", recipe)}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRecipeAction("reject", recipe)}>
                              <UserX className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        <Button size="sm" variant="outline" onClick={() => handleRecipeAction("delete", recipe)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend" && "Suspend User"}
              {actionType === "ban" && "Ban User"}
              {actionType === "changeRole" && "Change User Role"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedUser && (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.username} />
                  <AvatarFallback>{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{selectedUser.username}</span>
              </div>
            )}

            {actionType === "changeRole" && (
              <div>
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(ROLE_HIERARCHY).map((role) => (
                      <SelectItem key={role} value={role} disabled={!hasPermission(currentUser.role, role as UserRole)}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === "suspend" && (
              <div>
                <Label>Suspension Duration (days)</Label>
                <Input
                  type="number"
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(e.target.value)}
                  min="1"
                  max="365"
                />
              </div>
            )}

            {(actionType === "suspend" || actionType === "ban") && (
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={executeUserAction}
                disabled={(actionType === "suspend" || actionType === "ban") && !actionReason.trim()}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Recipe"}
              {actionType === "reject" && "Reject Recipe"}
              {actionType === "delete" && "Delete Recipe"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRecipe && (
              <div className="flex items-center gap-2">
                <ChefHat className="w-8 h-8" />
                <span className="font-medium">{selectedRecipe.title}</span>
              </div>
            )}

            <div>
              <Label>Notes</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Enter notes for this action..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRecipeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={executeRecipeAction}>Confirm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
