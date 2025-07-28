"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  ChefHat,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Shield,
  BarChart3,
  RefreshCw,
  MessageSquare,
} from "lucide-react"

interface AdminStats {
  totalUsers: number
  totalRecipes: number
  pendingRecipes: number
  approvedRecipes: number
  rejectedRecipes: number
  totalComments: number
  flaggedComments: number
  totalRatings: number
  averageRating: number
  recentUsers: number
  recentRecipes: number
  lastUpdated: string
}

export function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUserAndStats()
  }, [])

  const loadUserAndStats = async () => {
    console.log("🔄 [ADMIN-DASHBOARD] Loading user and stats...")
    setLoading(true)
    setError("")

    try {
      // First, get current user
      const userResponse = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("👤 [ADMIN-DASHBOARD] User response status:", userResponse.status)

      if (userResponse.ok) {
        const userData = await userResponse.json()
        console.log("👤 [ADMIN-DASHBOARD] User data:", userData)

        if (userData.success && userData.user) {
          setUser(userData.user)

          // Check if user has admin privileges
          const adminRoles = ["admin", "owner", "moderator"]
          if (!adminRoles.includes(userData.user.role)) {
            setError("You don't have admin privileges")
            setLoading(false)
            return
          }

          // Load stats if user is admin
          await loadStats()
        } else {
          setError("Failed to get user information")
          setLoading(false)
        }
      } else {
        setError("Authentication required")
        setLoading(false)
      }
    } catch (error) {
      console.error("❌ [ADMIN-DASHBOARD] Error loading user:", error)
      setError("Network error loading user information")
      setLoading(false)
    }
  }

  const loadStats = async () => {
    console.log("📊 [ADMIN-DASHBOARD] Loading admin stats...")

    try {
      const response = await fetch("/api/admin/stats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      })

      console.log("📡 [ADMIN-DASHBOARD] Stats response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📡 [ADMIN-DASHBOARD] Stats response data:", data)

        if (data.success && data.stats) {
          console.log("✅ [ADMIN-DASHBOARD] Stats loaded successfully:", data.stats)
          setStats(data.stats)
          setError("")
        } else {
          console.log("❌ [ADMIN-DASHBOARD] Stats API returned error:", data.error)
          setError(data.error || "Failed to load stats")
        }
      } else {
        const errorText = await response.text()
        console.error("❌ [ADMIN-DASHBOARD] Stats API failed:", response.status, errorText)
        setError(`Failed to load admin stats (${response.status})`)
      }
    } catch (error) {
      console.error("❌ [ADMIN-DASHBOARD] Error fetching admin stats:", error)
      setError("Network error loading admin stats")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    console.log("🔄 [ADMIN-DASHBOARD] Retrying stats load...")
    loadUserAndStats()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          {user && (
            <Badge variant="outline">
              {user.username} ({user.role})
            </Badge>
          )}
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Dashboard Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-2">
              <Button onClick={handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              {error.includes("Authentication") && (
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Go to Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please log in to access the admin dashboard.</p>
        <Button onClick={() => router.push("/login")} className="mt-4">
          Go to Login
        </Button>
      </div>
    )
  }

  const adminRoles = ["admin", "owner", "moderator"]
  if (!adminRoles.includes(user.role)) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
        <Badge variant="outline" className="mt-2">
          Current Role: {user.role}
        </Badge>
        <Button onClick={() => router.push("/")} className="mt-4">
          Go to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}!</h1>
            <p className="opacity-90">
              {user.role === "owner"
                ? "Owner Dashboard"
                : user.role === "admin"
                  ? "Admin Dashboard"
                  : "Moderator Dashboard"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRetry}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold">{stats.totalUsers}</p>
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Recipes</p>
                  <p className="text-3xl font-bold">{stats.totalRecipes}</p>
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-3xl font-bold">{stats.pendingRecipes}</p>
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold">{stats.averageRating}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="mt-2 text-sm text-gray-600">From {stats.totalRatings} ratings</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recipe Moderation */}
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
              <Badge variant={stats && stats.pendingRecipes > 0 ? "destructive" : "secondary"}>
                {stats ? stats.pendingRecipes : 0} pending
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
              <Badge variant="secondary">{stats ? stats.totalRecipes : 0} total</Badge>
              <Button variant="outline" size="sm">
                Manage →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        {["admin", "owner"].includes(user.role) && (
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
                <Badge variant="secondary">{stats ? stats.totalUsers : 0} users</Badge>
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
              <MessageSquare className="w-5 h-5 text-purple-500" />
              Comment Moderation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">Review flagged comments and manage discussions</p>
            <div className="flex items-center justify-between">
              <Badge variant={stats && stats.flaggedComments > 0 ? "destructive" : "secondary"}>
                {stats ? stats.flaggedComments : 0} flagged
              </Badge>
              <Button variant="outline" size="sm">
                Review →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics */}
        {["admin", "owner"].includes(user.role) && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

      {/* Success Message */}
      {stats && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Admin dashboard loaded successfully. Statistics last updated: {new Date(stats.lastUpdated).toLocaleString()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default AdminDashboard
