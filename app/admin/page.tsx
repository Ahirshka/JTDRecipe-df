"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Users, BookOpen, Settings, Crown, AlertTriangle } from "lucide-react"

interface User {
  id: number
  username: string
  email: string
  role: string
  status: string
  email_verified: boolean
  avatar?: string
  created_at: string
  last_login_at?: string
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    pendingRecipes: 0,
    activeUsers: 0,
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      console.log("Checking authentication...")
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      })

      const data = await response.json()
      console.log("Auth response:", data)

      if (!data.success || !data.authenticated || !data.user) {
        console.log("Not authenticated, redirecting to login")
        router.push("/login")
        return
      }

      const userData = data.user
      console.log("User data:", userData)

      // Check if user has admin privileges
      if (userData.role !== "admin" && userData.role !== "owner") {
        console.log("User role:", userData.role, "- not admin/owner")
        setError("Access denied. You need administrator privileges to view this page.")
        setIsLoading(false)
        return
      }

      setUser(userData)
      await loadStats()
    } catch (error) {
      console.error("Auth check failed:", error)
      setError("Failed to verify authentication")
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      // Mock stats for now - you can implement real API endpoints later
      setStats({
        totalUsers: 1,
        totalRecipes: 1,
        pendingRecipes: 0,
        activeUsers: 1,
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Access denied. You need administrator privileges to view this page.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            {user.role === "owner" ? (
              <Crown className="h-8 w-8 text-yellow-500" />
            ) : (
              <Shield className="h-8 w-8 text-blue-500" />
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === "owner" ? "Owner Dashboard" : "Admin Dashboard"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={user.role === "owner" ? "default" : "secondary"} className="text-sm">
              {user.role === "owner" ? "Site Owner" : "Administrator"}
            </Badge>
            <span className="text-gray-600">Welcome back, {user.username}</span>
          </div>
        </div>

        {/* Owner Access Confirmation */}
        {user.role === "owner" && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Crown className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Owner Access Confirmed!</strong> You have full administrative control over the platform. Email:{" "}
              {user.email} | Role: {user.role}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRecipes}</div>
              <p className="text-xs text-muted-foreground">Published recipes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRecipes}</div>
              <p className="text-xs text-muted-foreground">Awaiting moderation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Recently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/users")}>
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Recipe Moderation</span>
              </CardTitle>
              <CardDescription>Review and moderate user-submitted recipes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/recipes")}>
                Review Recipes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Site Settings</span>
              </CardTitle>
              <CardDescription>Configure platform settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-transparent" variant="outline">
                Site Settings
              </Button>
            </CardContent>
          </Card>

          {user.role === "owner" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span>Owner Controls</span>
                  </CardTitle>
                  <CardDescription>Owner-only administrative functions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-transparent" variant="outline">
                    Owner Panel
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    <span>System Admin</span>
                  </CardTitle>
                  <CardDescription>System-level administration and maintenance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-transparent" variant="outline">
                    System Admin
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest platform activity and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Owner account logged in</p>
                  <p className="text-sm text-gray-600">Just now</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Database initialized successfully</p>
                  <p className="text-sm text-gray-600">Today</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
