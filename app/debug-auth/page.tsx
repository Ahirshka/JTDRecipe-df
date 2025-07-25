"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Database,
  Cookie,
  Shield,
  AlertTriangle,
  LogIn,
  LogOut,
} from "lucide-react"

interface DebugInfo {
  timestamp: string
  environment: string
  database: {
    connected: boolean
    status: string
    error?: string
  }
  session: {
    valid: boolean
    error?: string
    user?: {
      id: number
      username: string
      email: string
      role: string
      status: string
    }
  }
  cookies: {
    hasSessionCookie: boolean
    sessionToken: string
    error?: string
  }
  users: {
    count: number
    list: any[]
    owner?: any
    testUser?: any
    error?: string
  }
}

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [loginForm, setLoginForm] = useState({
    email: "aaronhirshka@gmail.com",
    password: "Morton2121",
  })
  const [testLoginForm, setTestLoginForm] = useState({
    email: "test@example.com",
    password: "testpass123",
  })
  const [loginResult, setLoginResult] = useState<any>(null)

  const fetchDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/auth")
      const data = await response.json()
      setDebugInfo(data.debug)
    } catch (error) {
      console.error("Failed to fetch debug info:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()
      setLoginResult(data)

      // Refresh debug info after login attempt
      setTimeout(fetchDebugInfo, 1000)
    } catch (error) {
      setLoginResult({
        success: false,
        message: "Network error",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      const data = await response.json()
      setLoginResult(data)

      // Refresh debug info after logout
      setTimeout(fetchDebugInfo, 1000)
    } catch (error) {
      setLoginResult({
        success: false,
        message: "Logout failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔍 Authentication Debug Panel</h1>
        <p className="text-muted-foreground">Debug and test the authentication system</p>
      </div>

      <div className="mb-6">
        <Button onClick={fetchDebugInfo} disabled={loading} className="mr-4">
          {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Debug Info
        </Button>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="login">Login Test</TabsTrigger>
          <TabsTrigger value="session">Session Info</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {debugInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {debugInfo.database.connected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={debugInfo.database.connected ? "default" : "destructive"}>
                      {debugInfo.database.status}
                    </Badge>
                  </div>
                  {debugInfo.database.error && <p className="text-sm text-red-600">{debugInfo.database.error}</p>}
                </CardContent>
              </Card>

              {/* Session Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Session Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {debugInfo.session.valid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={debugInfo.session.valid ? "default" : "destructive"}>
                      {debugInfo.session.valid ? "Valid Session" : "No Session"}
                    </Badge>
                  </div>
                  {debugInfo.session.user && (
                    <div className="text-sm">
                      <p>
                        <strong>User:</strong> {debugInfo.session.user.username}
                      </p>
                      <p>
                        <strong>Role:</strong> {debugInfo.session.user.role}
                      </p>
                    </div>
                  )}
                  {debugInfo.session.error && <p className="text-sm text-red-600">{debugInfo.session.error}</p>}
                </CardContent>
              </Card>

              {/* Cookie Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cookie className="h-5 w-5" />
                    Cookie Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    {debugInfo.cookies.hasSessionCookie ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <Badge variant={debugInfo.cookies.hasSessionCookie ? "default" : "destructive"}>
                      {debugInfo.cookies.hasSessionCookie ? "Cookie Present" : "No Cookie"}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    <strong>Token:</strong> {debugInfo.cookies.sessionToken}
                  </p>
                  {debugInfo.cookies.error && <p className="text-sm text-red-600">{debugInfo.cookies.error}</p>}
                </CardContent>
              </Card>

              {/* Environment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Environment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Environment:</strong> {debugInfo.environment}
                    </p>
                    <p>
                      <strong>Timestamp:</strong> {new Date(debugInfo.timestamp).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {debugInfo && (
            <div className="space-y-6">
              {/* Users Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Users Overview
                  </CardTitle>
                  <CardDescription>Total users: {debugInfo.users.count}</CardDescription>
                </CardHeader>
                <CardContent>
                  {debugInfo.users.error ? (
                    <Alert variant="destructive">
                      <AlertDescription>{debugInfo.users.error}</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {/* Owner Account */}
                      <div>
                        <h4 className="font-medium mb-2">Owner Account</h4>
                        {debugInfo.users.owner ? (
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            <p>
                              <strong>ID:</strong> {debugInfo.users.owner.id}
                            </p>
                            <p>
                              <strong>Username:</strong> {debugInfo.users.owner.username}
                            </p>
                            <p>
                              <strong>Email:</strong> {debugInfo.users.owner.email}
                            </p>
                            <p>
                              <strong>Role:</strong> <Badge>{debugInfo.users.owner.role}</Badge>
                            </p>
                            <p>
                              <strong>Status:</strong> <Badge variant="secondary">{debugInfo.users.owner.status}</Badge>
                            </p>
                            <p>
                              <strong>Has Password:</strong> {debugInfo.users.owner.hasPasswordHash ? "✅" : "❌"}
                            </p>
                          </div>
                        ) : (
                          <Alert variant="destructive">
                            <AlertDescription>Owner account not found</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Test User Account */}
                      <div>
                        <h4 className="font-medium mb-2">Test User Account</h4>
                        {debugInfo.users.testUser ? (
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            <p>
                              <strong>ID:</strong> {debugInfo.users.testUser.id}
                            </p>
                            <p>
                              <strong>Username:</strong> {debugInfo.users.testUser.username}
                            </p>
                            <p>
                              <strong>Email:</strong> {debugInfo.users.testUser.email}
                            </p>
                            <p>
                              <strong>Role:</strong> <Badge>{debugInfo.users.testUser.role}</Badge>
                            </p>
                            <p>
                              <strong>Status:</strong>{" "}
                              <Badge variant="secondary">{debugInfo.users.testUser.status}</Badge>
                            </p>
                            <p>
                              <strong>Has Password:</strong> {debugInfo.users.testUser.hasPasswordHash ? "✅" : "❌"}
                            </p>
                          </div>
                        ) : (
                          <Alert variant="destructive">
                            <AlertDescription>Test user account not found</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* All Users List */}
                      <div>
                        <h4 className="font-medium mb-2">All Users</h4>
                        <div className="space-y-2">
                          {debugInfo.users.list.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <span className="font-medium">{user.username}</span>
                                <span className="text-sm text-muted-foreground ml-2">({user.email})</span>
                              </div>
                              <div className="flex gap-2">
                                <Badge variant={user.role === "owner" ? "default" : "secondary"}>{user.role}</Badge>
                                <Badge variant={user.status === "active" ? "default" : "destructive"}>
                                  {user.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="login" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner Login Test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Owner Login Test
                </CardTitle>
                <CardDescription>Test login with owner credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="owner-email">Email</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="owner-password">Password</Label>
                  <Input
                    id="owner-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                </div>
                <Button onClick={() => handleLogin(loginForm)} className="w-full">
                  Test Owner Login
                </Button>
              </CardContent>
            </Card>

            {/* Test User Login */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Test User Login
                </CardTitle>
                <CardDescription>Test login with test user credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-email">Email</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testLoginForm.email}
                    onChange={(e) => setTestLoginForm({ ...testLoginForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="test-password">Password</Label>
                  <Input
                    id="test-password"
                    type="password"
                    value={testLoginForm.password}
                    onChange={(e) => setTestLoginForm({ ...testLoginForm, password: e.target.value })}
                  />
                </div>
                <Button onClick={() => handleLogin(testLoginForm)} className="w-full">
                  Test User Login
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Login Result */}
          {loginResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {loginResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  Login Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant={loginResult.success ? "default" : "destructive"}>
                  <AlertDescription>{loginResult.message}</AlertDescription>
                </Alert>
                {loginResult.user && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Logged in as:</h4>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>ID:</strong> {loginResult.user.id}
                      </p>
                      <p>
                        <strong>Username:</strong> {loginResult.user.username}
                      </p>
                      <p>
                        <strong>Email:</strong> {loginResult.user.email}
                      </p>
                      <p>
                        <strong>Role:</strong> <Badge>{loginResult.user.role}</Badge>
                      </p>
                    </div>
                  </div>
                )}
                {loginResult.error && (
                  <div className="mt-4 text-sm text-red-600">
                    <strong>Error Details:</strong> {loginResult.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="session" className="space-y-6">
          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
                <CardDescription>Complete session and authentication state</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
