"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, User, Database, Shield, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface DebugInfo {
  database: {
    connected: boolean
    tablesExist: boolean
    userCount: number
    sessionCount: number
  }
  cookies: {
    sessionToken: string | null
    hasAuthCookie: boolean
  }
  users: Array<{
    id: number
    username: string
    email: string
    role: string
    status: string
    is_verified: boolean
  }>
  currentSession: {
    valid: boolean
    user: any
    error?: string
  }
}

export default function DebugAuthPage() {
  const { user, isAuthenticated, login, logout, checkAuth } = useAuth()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>({})

  // Test credentials
  const testCredentials = [
    { label: "Owner", email: "aaronhirshka@gmail.com", password: "Morton2121" },
    { label: "Test User", email: "test@example.com", password: "testpass123" },
  ]

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/auth", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
      }
    } catch (error) {
      console.error("Failed to fetch debug info:", error)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async (email: string, password: string, label: string) => {
    setTestLoading(true)
    setTestResults((prev) => ({ ...prev, [label]: { loading: true } }))

    try {
      const success = await login(email, password)
      setTestResults((prev) => ({
        ...prev,
        [label]: {
          success,
          message: success ? "Login successful" : "Login failed",
          loading: false,
        },
      }))

      if (success) {
        await checkAuth()
        await fetchDebugInfo()
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [label]: {
          success: false,
          message: error instanceof Error ? error.message : "Login error",
          loading: false,
        },
      }))
    } finally {
      setTestLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    await fetchDebugInfo()
    setTestResults({})
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Authentication Debug Panel
          </h1>
          <p className="text-gray-600 mt-2">
            Debug authentication system, test login functionality, and view system status.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Auth Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Current Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Authenticated:</span>
                <Badge variant={isAuthenticated ? "default" : "secondary"}>{isAuthenticated ? "Yes" : "No"}</Badge>
              </div>

              {user && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Username:</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified:</span>
                      <Badge variant={user.is_verified ? "default" : "secondary"}>
                        {user.is_verified ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={checkAuth} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Auth
                </Button>
                {isAuthenticated && (
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    Logout
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Login */}
          <Card>
            <CardHeader>
              <CardTitle>Test Login</CardTitle>
              <CardDescription>Test login functionality with predefined accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {testCredentials.map((cred) => (
                <div key={cred.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{cred.label}</p>
                      <p className="text-sm text-gray-600">{cred.email}</p>
                    </div>
                    <Button
                      onClick={() => testLogin(cred.email, cred.password, cred.label)}
                      disabled={testLoading}
                      size="sm"
                    >
                      {testResults[cred.label]?.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test Login"}
                    </Button>
                  </div>

                  {testResults[cred.label] && !testResults[cred.label].loading && (
                    <Alert variant={testResults[cred.label].success ? "default" : "destructive"}>
                      <AlertDescription className="flex items-center gap-2">
                        {testResults[cred.label].success ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {testResults[cred.label].message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : debugInfo ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Database</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Connected:</span>
                        <Badge variant={debugInfo.database.connected ? "default" : "destructive"}>
                          {debugInfo.database.connected ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Tables Exist:</span>
                        <Badge variant={debugInfo.database.tablesExist ? "default" : "destructive"}>
                          {debugInfo.database.tablesExist ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Users:</span>
                        <span>{debugInfo.database.userCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sessions:</span>
                        <span>{debugInfo.database.sessionCount}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Cookies</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Has Auth Cookie:</span>
                        <Badge variant={debugInfo.cookies.hasAuthCookie ? "default" : "secondary"}>
                          {debugInfo.cookies.hasAuthCookie ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Session Token:</span>
                        <span className="font-mono text-xs">
                          {debugInfo.cookies.sessionToken
                            ? debugInfo.cookies.sessionToken.substring(0, 10) + "..."
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Current Session</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Valid:</span>
                        <Badge variant={debugInfo.currentSession.valid ? "default" : "destructive"}>
                          {debugInfo.currentSession.valid ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {debugInfo.currentSession.error && (
                        <div className="text-red-600 text-xs">Error: {debugInfo.currentSession.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">Failed to load system status</div>
              )}

              <Button onClick={fetchDebugInfo} variant="outline" size="sm" className="w-full mt-4 bg-transparent">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>

          {/* Database Users */}
          <Card>
            <CardHeader>
              <CardTitle>Database Users</CardTitle>
              <CardDescription>All users currently in the database</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : debugInfo?.users ? (
                <div className="space-y-3">
                  {debugInfo.users.map((dbUser) => (
                    <div key={dbUser.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{dbUser.username}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {dbUser.role}
                          </Badge>
                          <Badge variant={dbUser.status === "active" ? "default" : "secondary"} className="text-xs">
                            {dbUser.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Email: {dbUser.email}</div>
                        <div>ID: {dbUser.id}</div>
                        <div>Verified: {dbUser.is_verified ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No users found</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common debugging and testing actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => window.open("/database-setup", "_blank")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Database Setup
              </Button>

              <Button
                onClick={() => window.open("/admin", "_blank")}
                variant="outline"
                className="flex items-center gap-2"
                disabled={!isAuthenticated || user?.role !== "owner"}
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </Button>

              <Button
                onClick={() => window.open("/add-recipe", "_blank")}
                variant="outline"
                className="flex items-center gap-2"
                disabled={!isAuthenticated}
              >
                <User className="w-4 h-4" />
                Add Recipe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
