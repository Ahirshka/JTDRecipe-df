"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, ChefHat, MessageSquare, Shield, BarChart3, Settings, Clock, AlertTriangle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AdminStats {
  totalUsers: number
  totalRecipes: number
  pendingRecipes: number
  approvedRecipes: number
  rejectedRecipes: number
  totalComments: number
  flaggedComments: number
}

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  // Check if user is admin
  const isAdmin = user?.role === "owner" || user?.role === "admin" || user?.role === "moderator"

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      if (!isAdmin) {
        router.push("/")
        return
      }

      fetchStats()
    }
  }, [isAuthenticated, isAdmin, isLoading, router])

  const fetchStats = async () => {
    try {
      console.log("🔄 [ADMIN-PAGE] Fetching admin stats...")

      const response = await fetch("/api/admin/stats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("🔄 [ADMIN-PAGE] Stats response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("🔄 [ADMIN-PAGE] Stats response data:", data)

        if (data.success) {
          setStats(data.stats)
          setError("")
        } else {
          console.error("❌ [ADMIN-PAGE] Stats API returned error:", data.error)
          setError(data.error || "Failed to load stats")
        }
      } else {
        const errorText = await response.text()
        console.error("❌ [ADMIN-PAGE] Stats API failed:", response.status, errorText)
        setError(`Failed to load admin stats (${response.status})`)
      }
    } catch (error) {
      console.error("❌ [ADMIN-PAGE] Error fetching admin stats:", error)
      setError("Network error loading admin stats")
    } finally {
      setLoading(false)
    }
  }

  // Show loading if checking auth
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    )
  }

  // Show access denied if not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Access Denied
            </CardTitle>
            <CardDescription>You don't have permission to access the admin panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.username}! Manage your recipe platform from here.</p>
          <Badge variant="secondary" className="mt-2">
            Role: {user?.role}
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" className="ml-4 bg-transparent" onClick={fetchStats}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRecipes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingRecipes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flagged Comments</CardTitle>
                <MessageSquare className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.flaggedComments}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Recipe Moderation
              </CardTitle>
              <CardDescription>Review and approve pending recipes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <Badge variant="outline" className="text-yellow-600">
                    {stats?.pendingRecipes || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved:</span>
                  <Badge variant="outline" className="text-green-600">
                    {stats?.approvedRecipes || 0}
                  </Badge>
                </div>
              </div>
              <Link href="/admin/recipes">
                <Button className="w-full">Moderate Recipes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                User Management
              </CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Users:</span>
                  <Badge variant="outline">{stats?.totalUsers || 0}</Badge>
                </div>
              </div>
              <Link href="/admin/users">
                <Button className="w-full bg-transparent" variant="outline">
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" />
                Comment Moderation
              </CardTitle>
              <CardDescription>Review flagged comments and discussions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Flagged:</span>
                  <Badge variant="outline" className="text-red-600">
                    {stats?.flaggedComments || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total:</span>
                  <Badge variant="outline">{stats?.totalComments || 0}</Badge>
                </div>
              </div>
              <Link href="/admin/comments">
                <Button className="w-full bg-transparent" variant="outline">
                  Moderate Comments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Analytics
              </CardTitle>
              <CardDescription>View platform statistics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">Track user engagement, popular recipes, and platform growth</div>
              </div>
              <Button className="w-full bg-transparent" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                System Settings
              </CardTitle>
              <CardDescription>Configure platform settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">Manage site configuration, email settings, and more</div>
              </div>
              <Button className="w-full bg-transparent" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Security
              </CardTitle>
              <CardDescription>Monitor security and access logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">Review login attempts, user activity, and security events</div>
              </div>
              <Button className="w-full bg-transparent" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Debug Information */}
        {error && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-red-600">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>User:</strong> {user?.username} ({user?.role})
                </div>
                <div>
                  <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Is Admin:</strong> {isAdmin ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Error:</strong> {error}
                </div>
              </div>
              <Button
                onClick={() => {
                  console.log("Current user:", user)
                  console.log("Is authenticated:", isAuthenticated)
                  console.log("Is admin:", isAdmin)
                  fetchStats()
                }}
                className="mt-4"
                variant="outline"
              >
                Debug & Retry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
