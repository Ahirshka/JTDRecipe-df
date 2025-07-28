"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  ChefHat,
  MessageSquare,
  Star,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AdminStats {
  users: {
    total: number
    active: number
    verified: number
    admins: number
  }
  recipes: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
  comments: {
    total: number
    flagged: number
  }
  ratings: {
    total: number
    average: number
  }
}

export function AdminDashboard() {
  const { user, isAuthenticated } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)

  const loadStats = async () => {
    console.log("📊 [ADMIN-DASHBOARD] Loading admin statistics...")
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/admin/stats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("📡 [ADMIN-DASHBOARD] Stats response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📡 [ADMIN-DASHBOARD] Stats response data:", data)

        if (data.success) {
          console.log("✅ [ADMIN-DASHBOARD] Stats loaded successfully:", data.stats)
          setStats(data.stats)
          setRetryCount(0) // Reset retry count on success
        } else {
          console.log("❌ [ADMIN-DASHBOARD] Stats loading failed:", data.error)
          setError(data.error || "Failed to load statistics")
        }
      } else {
        console.log("❌ [ADMIN-DASHBOARD] Stats request failed with status:", response.status)
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || `Failed to load statistics (${response.status})`)
      }
    } catch (error) {
      console.error("❌ [ADMIN-DASHBOARD] Stats loading error:", error)
      setError("Network error while loading statistics")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    console.log("🔄 [ADMIN-DASHBOARD] Retrying stats load...")
    setRetryCount((prev) => prev + 1)
    loadStats()
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("🚀 [ADMIN-DASHBOARD] Component mounted, loading stats...")
      loadStats()
    }
  }, [isAuthenticated, user])

  // Check if user has admin access
  const hasAdminAccess = isAuthenticated && user && ["admin", "owner", "moderator"].includes(user.role)

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access the admin dashboard.</p>
        </CardContent>
      </Card>
    )
  }

  if (!hasAdminAccess) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
          <Badge variant="outline" className="mt-2">
            Current Role: {user?.role}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <Badge variant="outline">
            {user?.username} ({user?.role})
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-24">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 animate-pulse text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading admin statistics...</p>
            {retryCount > 0 && <p className="text-sm text-gray-500 mt-2">Retry attempt: {retryCount}</p>}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <Badge variant="outline">
            {user?.username} ({user?.role})
          </Badge>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
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
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Statistics</h3>
            <p className="text-gray-600 mb-4">There was an error loading the admin dashboard data.</p>
            <Button onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <Badge variant="outline">
            {user?.username} ({user?.role})
          </Badge>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">No statistics data was returned from the server.</p>
            <Button onClick={handleRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {user?.username} ({user?.role})
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Active: {stats.users.active}</span>
                <span className="text-blue-600">Verified: {stats.users.verified}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-purple-600">Admins: {stats.users.admins}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipes Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recipes.total}</div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-600 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {stats.recipes.approved}
                </span>
                <span className="text-yellow-600 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {stats.recipes.pending}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-red-600 flex items-center">
                  <XCircle className="w-3 h-3 mr-1" />
                  {stats.recipes.rejected}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.comments.total}</div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Flagged: {stats.comments.flagged}</span>
                <span className="text-green-600">Clean: {stats.comments.total - stats.comments.flagged}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ratings Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ratings</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ratings.total}</div>
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-yellow-600">Avg: {stats.ratings.average.toFixed(1)}/5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>Admin dashboard loaded successfully. All statistics are up to date.</AlertDescription>
      </Alert>
    </div>
  )
}

export default AdminDashboard
