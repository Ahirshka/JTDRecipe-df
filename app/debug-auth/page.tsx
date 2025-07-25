"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, User, Database, Key, CheckCircle, XCircle, RefreshCw, LogIn, Crown } from "lucide-react"

interface AuthDebugInfo {
  currentUser: any
  sessionValid: boolean
  databaseConnected: boolean
  ownerExists: boolean
  testResults: any
}

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [testCredentials, setTestCredentials] = useState({
    email: "aaronhirshka@gmail.com",
    password: "Morton2121",
  })
  const [loginResult, setLoginResult] = useState<any>(null)

  useEffect(() => {
    loadDebugInfo()
  }, [])

  const loadDebugInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/auth", {
        credentials: "include",
      })
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error("Error loading debug info:", error)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setLoginResult(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(testCredentials),
      })

      const data = await response.json()
      setLoginResult(data)

      // Reload debug info after login attempt
      await loadDebugInfo()
    } catch (error) {
      console.error("Login test error:", error)
      setLoginResult({ success: false, error: "Network error" })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      await loadDebugInfo()
      setLoginResult(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />
  }

  const getStatusBadge = (condition: boolean) => {
    return <Badge variant={condition ? "default" : "destructive"}>{condition ? "OK" : "FAIL"}</Badge>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Authentication Debug</h1>
          </div>
          <p className="text-gray-600">Debug authentication system and test login functionality</p>
        </div>

        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">System Status</TabsTrigger>
            <TabsTrigger value="login">Login Test</TabsTrigger>
            <TabsTrigger value="details">Debug Details</TabsTrigger>
          </TabsList>

          {/* System Status Tab */}
          <TabsContent value="status">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Database Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(debugInfo?.databaseConnected || false)}
                      <span className="ml-2">Connection</span>
                    </div>
                    {getStatusBadge(debugInfo?.databaseConnected || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(debugInfo?.ownerExists || false)}
                      <span className="ml-2">Owner Account</span>
                    </div>
                    {getStatusBadge(debugInfo?.ownerExists || false)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Session Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(debugInfo?.sessionValid || false)}
                      <span className="ml-2">Session Valid</span>
                    </div>
                    {getStatusBadge(debugInfo?.sessionValid || false)}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(!!debugInfo?.currentUser)}
                      <span className="ml-2">User Logged In</span>
                    </div>
                    {getStatusBadge(!!debugInfo?.currentUser)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {debugInfo?.currentUser && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="w-5 h-5 mr-2 text-yellow-600" />
                    Current User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Username</Label>
                      <p className="font-medium">{debugInfo.currentUser.username}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="font-medium">{debugInfo.currentUser.email}</p>
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Badge variant={debugInfo.currentUser.role === "owner" ? "default" : "secondary"}>
                        {debugInfo.currentUser.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={logout} variant="outline">
                      Logout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-center mt-6">
              <Button onClick={loadDebugInfo} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </TabsContent>

          {/* Login Test Tab */}
          <TabsContent value="login">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Test Login
                  </CardTitle>
                  <CardDescription>Test authentication with owner credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="test-email">Email</Label>
                    <Input
                      id="test-email"
                      type="email"
                      value={testCredentials.email}
                      onChange={(e) => setTestCredentials({ ...testCredentials, email: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="test-password">Password</Label>
                    <Input
                      id="test-password"
                      type="password"
                      value={testCredentials.password}
                      onChange={(e) => setTestCredentials({ ...testCredentials, password: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <Button onClick={testLogin} disabled={loading} className="w-full">
                    <LogIn className="w-4 h-4 mr-2" />
                    Test Login
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Owner Credentials</CardTitle>
                  <CardDescription>Default owner account information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Email</Label>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">aaronhirshka@gmail.com</p>
                  </div>
                  <div>
                    <Label>Password</Label>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">Morton2121</p>
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Badge>owner</Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setTestCredentials({
                        email: "aaronhirshka@gmail.com",
                        password: "Morton2121",
                      })
                    }
                    className="w-full"
                  >
                    Fill Credentials
                  </Button>
                </CardContent>
              </Card>
            </div>

            {loginResult && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {loginResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    Login Test Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert variant={loginResult.success ? "default" : "destructive"}>
                    <AlertDescription>
                      {loginResult.success ? (
                        <div>
                          <p className="font-medium text-green-800">✅ Login successful!</p>
                          {loginResult.user && (
                            <div className="mt-2 text-sm">
                              <p>User: {loginResult.user.username}</p>
                              <p>Role: {loginResult.user.role}</p>
                              <p>Email: {loginResult.user.email}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="font-medium text-red-800">❌ {loginResult.error || "Login failed"}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Debug Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Raw Debug Information</CardTitle>
                <CardDescription>Complete system debug data</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
