"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ChefHat,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  Shield,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AdminStats {
  totalUsers: number
  totalRecipes: number
  pendingRecipes: number
  approvedRecipes: number
  totalRatings: number
  averageRating: number
  recentUsers: number
  recentRecipes: number
}

export function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalRecipes: 0,
    pendingRecipes: 0,
    approvedRecipes: 0,
    totalRatings: 0,
    averageRating: 0,
    recentUsers: 0,
    recentRecipes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Check if user has admin permissions
  const isAdmin = isAuthenticated && user && ["admin", "owner"].includes(user.role)
  const isModerator = isAuthenticated && user && ["admin", "owner", "moderator"].includes(user.role)

  useEffect(() => {
    if (isAdmin) {
      loadStats()
    }
  }, [isAdmin])

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
          setError(data.error || "Failed to load stats")
        }
      } else {
        setError("Failed to load admin statistics")
      }
    } catch (error) {
      console.error("Error loading admin stats:", error)
      setError("Failed to load admin statistics")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please log in to access the admin dashboard.</p>
      </div>
    )
  }

  if (!isModerator) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user.username}!</h1>
        <p className="opacity-90">
          {user.role === "owner"
            ? "Owner Dashboard"
            : user.role === "admin"
              ? "Admin Dashboard"
              : "Moderator Dashboard"}
        </p>
      </div>

      {/* Quick Stats */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">+{stats.recentUsers} this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Recipes</p>
                  <p className="text-2xl font-bold">{stats.totalRecipes}</p>
                </div>
                <ChefHat className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">+{stats.recentRecipes} this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold">{stats.pendingRecipes}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="mt-2">
                <Badge variant={stats.pendingRecipes > 0 ? "destructive" : "secondary"}>
                  {stats.pendingRecipes > 0 ? "Needs Attention" : "All Clear"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="mt-2 text-sm text-gray-600">From {stats.totalRatings} ratings</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recipe Management */}
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/admin/recipes")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              Recipe Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Review and moderate pending recipe submissions</p>
            <div className="flex items-center justify-between">
              <Badge variant={stats.pendingRecipes > 0 ? "destructive" : "secondary"}>
                {stats.pendingRecipes} pending
              </Badge>
              <Button variant="outline" size="sm">
                Review →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recipe Management */}
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/admin/recipes/manage")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Manage Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Search, filter, and manage all recipes in the system</p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{stats.totalRecipes} total</Badge>
              <Button variant="outline" size="sm">
                Manage →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        {isAdmin && (
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/users")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">Manage user accounts, roles, and permissions</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{stats.totalUsers} users</Badge>
                <Button variant="outline" size="sm">
                  Manage →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Moderation */}
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push("/admin/comments")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Comment Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Review flagged comments and manage discussions</p>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Active</Badge>
              <Button variant="outline" size="sm">
                Review →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        {isAdmin && (
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/analytics")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">View detailed analytics and usage statistics</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Reports</Badge>
                <Button variant="outline" size="sm">
                  View →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Settings */}
        {user.role === "owner" && (
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push("/admin/settings")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">Configure system settings and preferences</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Owner Only</Badge>
                <Button variant="outline" size="sm">
                  Configure →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
              onClick={() => router.push("/admin/recipes")}
            >
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span>Approve Recipes</span>
              <Badge variant="secondary">{stats.pendingRecipes} pending</Badge>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
              onClick={() => router.push("/admin/recipes/manage")}
            >
              <Settings className="w-6 h-6 text-blue-500" />
              <span>Manage All Recipes</span>
              <Badge variant="secondary">{stats.totalRecipes} total</Badge>
            </Button>

            {isAdmin && (
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 bg-transparent"
                onClick={() => router.push("/admin/users")}
              >
                <Users className="w-6 h-6 text-purple-500" />
                <span>Manage Users</span>
                <Badge variant="secondary">{stats.totalUsers} users</Badge>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminDashboard
