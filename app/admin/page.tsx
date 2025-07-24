"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, FileText, MessageCircle, Flag, BarChart3, Shield, Settings, ChefHat, AlertTriangle } from "lucide-react"

interface AdminStats {
  users: number
  recipes: number
  pending: number
  comments?: number
  flaggedComments?: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({ users: 0, recipes: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadStats()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && (data.user.role === "admin" || data.user.role === "owner")) {
          setUser(data.user)
        } else {
          router.push("/login")
        }
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/login")
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.stats)
        } else {
          setMessage("Failed to load statistics")
        }
      } else {
        setMessage("Failed to load statistics")
      }
    } catch (error) {
      console.error("Failed to load stats:", error)
      setMessage("Failed to load statistics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {user.role}
              </Badge>
              <span className="text-sm text-gray-600">Welcome, {user.username}</span>
              <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                Back to Site
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Recipes</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recipes}</div>
              <p className="text-xs text-muted-foreground">Live on the site</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting moderation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
              <Flag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.flaggedComments || 0}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                  onClick={() => router.push("/admin/users")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
                <div className="text-sm text-gray-600">
                  <p>• Search and filter users</p>
                  <p>• Block or suspend accounts</p>
                  <p>• Verify user profiles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Moderation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Recipe Moderation
              </CardTitle>
              <CardDescription>Review and moderate recipe submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                  onClick={() => router.push("/admin/recipes")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Review Recipes
                  {stats.pending > 0 && <Badge className="ml-auto bg-red-500">{stats.pending}</Badge>}
                </Button>
                <div className="text-sm text-gray-600">
                  <p>• Approve or reject recipes</p>
                  <p>• Edit before publishing</p>
                  <p>• Manage recipe categories</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comment Moderation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comment Moderation
              </CardTitle>
              <CardDescription>Monitor and moderate user comments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                  onClick={() => router.push("/admin/comments")}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Pending Comments
                </Button>
                <Button
                  className="w-full justify-start bg-transparent"
                  variant="outline"
                  onClick={() => router.push("/admin/flagged-comments")}
                >
                  <Flag className="mr-2 h-4 w-4" />
                  Flagged Comments
                  {(stats.flaggedComments || 0) > 0 && (
                    <Badge className="ml-auto bg-red-500">{stats.flaggedComments}</Badge>
                  )}
                </Button>
                <div className="text-sm text-gray-600">
                  <p>• Review flagged content</p>
                  <p>• Approve or reject comments</p>
                  <p>• Manage bad language filter</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>View site statistics and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                  <Badge className="ml-auto" variant="secondary">
                    Soon
                  </Badge>
                </Button>
                <div className="text-sm text-gray-600">
                  <p>• User engagement metrics</p>
                  <p>• Popular recipes</p>
                  <p>• Site performance data</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Site Settings
              </CardTitle>
              <CardDescription>Configure site-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full justify-start bg-transparent" variant="outline" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Site Configuration
                  <Badge className="ml-auto" variant="secondary">
                    Soon
                  </Badge>
                </Button>
                <div className="text-sm text-gray-600">
                  <p>• Email settings</p>
                  <p>• Moderation rules</p>
                  <p>• Feature toggles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Status
              </CardTitle>
              <CardDescription>Monitor system health and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <Badge className="bg-green-100 text-green-800">Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
