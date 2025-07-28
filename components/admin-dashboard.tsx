"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  ChefHat,
  MessageSquare,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  Activity,
} from "lucide-react"
import Link from "next/link"

interface AdminStats {
  users: {
    total: number
    active: number
    verified: number
    admins: number
    newThisMonth: number
  }
  recipes: {
    total: number
    approved: number
    pending: number
    rejected: number
    newThisMonth: number
  }
  comments: {
    total: number
    active: number
    flagged: number
    newThisMonth: number
  }
  ratings: {
    total: number
    average: number
    newThisMonth: number
  }
  recentActivity: Array<{
    type: string
    title: string
    action: string
    createdAt: string
  }>
}

interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
  isVerified: boolean
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Check if user is admin
  const isAdmin = user && ["admin", "owner", "moderator"].includes(user.role)

  // Fetch current user
  const fetchUser = async () => {
    try {
      console.log("👤 [ADMIN-DASHBOARD] Fetching current user...")

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      })

      console.log("📡 [ADMIN-DASHBOARD] User fetch response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ [ADMIN-DASHBOARD] User data received:", {
          success: data.success,
          hasUser: !!data.user,
          username: data.user?.username,
          role: data.user?.role,
        })

        if (data.success && data.user) {
          setUser(data.user)
          return data.user
        } else {
          console.log("❌ [ADMIN-DASHBOARD] No user in response")
          setError("Authentication required")
          return null
        }
      } else {
        console.log("❌ [ADMIN-DASHBOARD] User fetch failed:", response.status)
        setError("Authentication required")
        return null
      }
    } catch (error) {
      console.error("❌ [ADMIN-DASHBOARD] Error fetching user:", error)
      setError("Failed to authenticate")
      return null
    }
  }

  // Fetch admin statistics
  const fetchStats = async () => {
    try {
      console.log("📊 [ADMIN-DASHBOARD] Fetching admin stats...")

      const response = await fetch("/api/admin/stats", {
        method: "GET",
        credentials: "include",
      })

      console.log("📡 [ADMIN-DASHBOARD] Stats fetch response:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ [ADMIN-DASHBOARD] Stats data received:", {
          success: data.success,
          hasStats: !!data.stats,
          totalUsers: data.stats?.users?.total,
          totalRecipes: data.stats?.recipes?.total,
        })

        if (data.success && data.stats) {
          setStats(data.stats)
          setError(null)
        } else {
          console.log("❌ [ADMIN-DASHBOARD] No stats in response:", data.error)
          setError(data.error || "Failed to load statistics")
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.log("❌ [ADMIN-DASHBOARD] Stats fetch failed:", response.status, errorData)
        setError(errorData.error || `Failed to load statistics (${response.status})`)
      }
    } catch (error) {
      console.error("❌ [ADMIN-DASHBOARD] Error fetching stats:", error)
      setError("Network error while loading statistics")
    }
  }

  // Load data
  const loadData = async () => {
    console.log("🔄 [ADMIN-DASHBOARD] Loading dashboard data...")
    setLoading(true)
    setError(null)

    try {
      // First get user
      const currentUser = await fetchUser()

      if (currentUser && ["admin", "owner", "moderator"].includes(currentUser.role)) {
        console.log("✅ [ADMIN-DASHBOARD] Admin user verified, fetching stats...")
        await fetchStats()
      } else {
        console.log("❌ [ADMIN-DASHBOARD] User is not admin:", currentUser?.role)
        setError("Admin access required")
      }
    } catch (error) {
      console.error("❌ [ADMIN-DASHBOARD] Error loading data:", error)
      setError("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  // Retry function
  const handleRetry = () => {
    console.log("🔄 [ADMIN-DASHBOARD] Retrying dashboard load...")
    setRetryCount((prev) => prev + 1)
    loadData()
  }

  // Load data on mount and when retry count changes
  useEffect(() => {
    loadData()
  }, [retryCount])

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>

        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Username:</strong> {user.username}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Role:</strong> <Badge variant="outline">{user.role}</Badge>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge variant={user.status === "active" ? "default" : "destructive"}>{user.status}</Badge>
                </p>
                <p>
                  <strong>Verified:</strong>{" "}
                  <Badge variant={user.isVerified ? "default" : "secondary"}>{user.isVerified ? "Yes" : "No"}</Badge>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>Admin access required. Your current role: {user?.role || "unknown"}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show dashboard if we have stats
  if (!stats) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No statistics available</span>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.username}! Here's what's happening with your recipe platform.
          </p>
        </div>
        <Button onClick={handleRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.users.newThisMonth} new this month</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats.users.active} active
              </Badge>
              <Badge variant="outline" className="text-xs">
                {stats.users.verified} verified
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recipes Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recipes.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.recipes.newThisMonth} new this month</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {stats.recipes.approved} approved
              </Badge>
              {stats.recipes.pending > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {stats.recipes.pending} pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comments.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.comments.newThisMonth} new this month</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {stats.comments.active} active
              </Badge>
              {stats.comments.flagged > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {stats.comments.flagged} flagged
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ratings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratings</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ratings.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Avg: {stats.ratings.average.toFixed(1)} stars</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {stats.ratings.newThisMonth} new this month
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">View and moderate user accounts</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/recipes">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Pending Recipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Review and approve recipes</p>
              {stats.recipes.pending > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {stats.recipes.pending} pending
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/recipes/manage">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Manage Recipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">View and manage all recipes</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/comments">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Moderate Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Review flagged comments</p>
              {stats.comments.flagged > 0 && (
                <Badge variant="destructive" className="mt-2">
                  {stats.comments.flagged} flagged
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions on your platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {activity.type === "user" && <Users className="h-4 w-4 text-blue-500" />}
                        {activity.type === "recipe" && <ChefHat className="h-4 w-4 text-green-500" />}
                        {activity.type === "comment" && <MessageSquare className="h-4 w-4 text-orange-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.action}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Health
            </CardTitle>
            <CardDescription>Key metrics and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">User Verification Rate</span>
                <Badge variant="outline">
                  {stats.users.total > 0 ? Math.round((stats.users.verified / stats.users.total) * 100) : 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Recipe Approval Rate</span>
                <Badge variant="outline">
                  {stats.recipes.total > 0 ? Math.round((stats.recipes.approved / stats.recipes.total) * 100) : 0}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Rating</span>
                <Badge variant="outline">{stats.ratings.average.toFixed(1)} ⭐</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Users</span>
                <Badge variant={stats.users.active > stats.users.total * 0.8 ? "default" : "secondary"}>
                  {stats.users.active} / {stats.users.total}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
