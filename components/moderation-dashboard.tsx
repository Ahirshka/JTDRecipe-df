"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Users, AlertTriangle, Ban, CheckCircle, Clock, Search, Eye, UserX, UserCheck } from "lucide-react"
import {
  type User,
  type UserRole,
  getAllUsersForModeration,
  hasPermission,
  canModerateUser,
  suspendUser,
  unsuspendUser,
  banUser,
  changeUserRole,
  verifyUser,
  warnUser,
  ROLE_HIERARCHY,
} from "@/lib/auth"

interface ModerationDashboardProps {
  currentUser: User
}

export function ModerationDashboard({ currentUser }: ModerationDashboardProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<string>("")
  const [actionReason, setActionReason] = useState("")
  const [suspensionDays, setSuspensionDays] = useState("7")
  const [newRole, setNewRole] = useState<UserRole>("user")
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterRole, filterStatus])

  const loadUsers = () => {
    const allUsers = getAllUsersForModeration()
    setUsers(allUsers)
  }

  const filterUsers = () => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = filterRole === "all" || user.role === filterRole
      const matchesStatus = filterStatus === "all" || user.status === filterStatus

      return matchesSearch && matchesRole && matchesStatus
    })

    setFilteredUsers(filtered)
  }

  const handleAction = async (action: string, user: User) => {
    setSelectedUser(user)
    setActionType(action)
    setActionReason("")
    setSuspensionDays("7")
    setNewRole(user.role)
    setIsActionDialogOpen(true)
  }

  const executeAction = () => {
    if (!selectedUser) return

    let success = false
    const moderatorId = currentUser.id
    const moderatorName = currentUser.username

    switch (actionType) {
      case "suspend":
        success = suspendUser(
          selectedUser.id,
          moderatorId,
          moderatorName,
          actionReason,
          Number.parseInt(suspensionDays),
        )
        break
      case "unsuspend":
        success = unsuspendUser(selectedUser.id, moderatorId, moderatorName)
        break
      case "ban":
        success = banUser(selectedUser.id, moderatorId, moderatorName, actionReason)
        break
      case "verify":
        success = verifyUser(selectedUser.id, moderatorId, moderatorName)
        break
      case "warn":
        success = warnUser(selectedUser.id, moderatorId, moderatorName, actionReason)
        break
      case "changeRole":
        success = changeUserRole(selectedUser.id, newRole, moderatorId, moderatorName)
        break
    }

    if (success) {
      setMessage(`Action completed successfully`)
      loadUsers()
      setIsActionDialogOpen(false)
    } else {
      setMessage("Action failed")
    }

    setTimeout(() => setMessage(""), 3000)
  }

  const canModerate = (targetUser: User) => {
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

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    banned: users.filter((u) => u.status === "banned").length,
    verified: users.filter((u) => u.isVerified).length,
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Banned</p>
                <p className="text-2xl font-bold">{stats.banned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{stats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

          {/* Users Table */}
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
                      {user.isVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {user.warningCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {user.warningCount} warnings
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                      <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                      {user.provider && user.provider !== "email" && (
                        <Badge variant="outline" className="text-xs">
                          {user.provider}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-gray-600">
                    <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                    {user.lastLoginAt && <p>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</p>}
                  </div>

                  {canModerate(user) && (
                    <div className="flex gap-1">
                      {user.status === "suspended" ? (
                        <Button size="sm" variant="outline" onClick={() => handleAction("unsuspend", user)}>
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleAction("suspend", user)}>
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}

                      <Button size="sm" variant="outline" onClick={() => handleAction("warn", user)}>
                        <AlertTriangle className="w-4 h-4" />
                      </Button>

                      {hasPermission(currentUser.role, "admin") && (
                        <Button size="sm" variant="outline" onClick={() => handleAction("changeRole", user)}>
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details: {user.username}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Email</Label>
                                <p className="text-sm">{user.email}</p>
                              </div>
                              <div>
                                <Label>Role</Label>
                                <p className="text-sm">{user.role}</p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <p className="text-sm">{user.status}</p>
                              </div>
                              <div>
                                <Label>Warnings</Label>
                                <p className="text-sm">{user.warningCount}</p>
                              </div>
                            </div>

                            {user.moderationNotes && user.moderationNotes.length > 0 && (
                              <div>
                                <Label>Moderation History</Label>
                                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                                  {user.moderationNotes.map((note) => (
                                    <div key={note.id} className="p-2 bg-gray-50 rounded text-sm">
                                      <div className="flex justify-between items-start">
                                        <span className="font-medium">{note.action}</span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-gray-600">{note.note}</p>
                                      <p className="text-xs text-gray-500">by {note.moderatorName}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "suspend" && "Suspend User"}
              {actionType === "unsuspend" && "Unsuspend User"}
              {actionType === "ban" && "Ban User"}
              {actionType === "warn" && "Warn User"}
              {actionType === "verify" && "Verify User"}
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

            {(actionType === "suspend" || actionType === "ban" || actionType === "warn") && (
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
                onClick={executeAction}
                disabled={
                  (actionType === "suspend" || actionType === "ban" || actionType === "warn") && !actionReason.trim()
                }
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
