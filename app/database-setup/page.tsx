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
  Database,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  ChefHat,
  Settings,
  AlertCircle,
  User,
  Mail,
  Calendar,
  RotateCcw,
  Key,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DatabaseStatus {
  success: boolean
  data?: {
    tables: {
      users: boolean
      sessions: boolean
      recipes: boolean
    }
    owner: {
      exists: boolean
      info?: {
        id: number
        username: string
        email: string
        role: string
        status: string
        is_verified: boolean
        created_at: string
      }
    }
    counts: {
      users: number
      recipes: number
    }
    database_ready: boolean
  }
  error?: string
  details?: string
}

interface InitResponse {
  success: boolean
  message?: string
  data?: {
    database: string
    owner: {
      id: number
      username: string
      email: string
      role: string
    }
    credentials: {
      email: string
      password: string
    }
    reinitialized?: boolean
  }
  error?: string
  details?: string
}

export default function DatabaseSetupPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initResult, setInitResult] = useState<InitResponse | null>(null)
  const [rawResponse, setRawResponse] = useState("")

  // Owner configuration form
  const [ownerConfig, setOwnerConfig] = useState({
    username: "admin",
    email: "admin@recipesite.com",
    password: "admin123",
    role: "owner",
  })

  // Check database status on component mount
  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setIsLoading(true)
    try {
      console.log("🔍 [DB-SETUP] Checking database status...")

      const response = await fetch("/api/init-db", {
        method: "GET",
      })

      const data = await response.json()
      setStatus(data)

      console.log("📊 [DB-SETUP] Database status:", data)
    } catch (error) {
      console.error("❌ [DB-SETUP] Status check error:", error)
      setStatus({
        success: false,
        error: "Failed to check database status",
        details: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializeDatabase = async (reinitialize = false) => {
    setIsInitializing(true)
    setInitResult(null)
    setRawResponse("")

    try {
      console.log(`🔄 [DB-SETUP] ${reinitialize ? "Reinitializing" : "Initializing"} database...`)

      const response = await fetch("/api/init-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reinitialize,
          ownerData: ownerConfig,
        }),
      })

      const responseText = await response.text()
      setRawResponse(responseText)

      let result: InitResponse
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        result = {
          success: false,
          error: "JSON Parse Error",
          details: `Failed to parse response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
        }
      }

      setInitResult(result)

      if (result.success) {
        toast({
          title: reinitialize ? "Database reinitialized!" : "Database initialized!",
          description: "Database tables and owner account created successfully",
        })

        // Refresh status after successful initialization
        setTimeout(() => {
          checkDatabaseStatus()
        }, 1000)
      } else {
        toast({
          title: "Initialization failed",
          description: result.error || "Failed to initialize database",
          variant: "destructive",
        })
      }

      console.log("📝 [DB-SETUP] Initialization result:", result)
    } catch (error) {
      console.error("❌ [DB-SETUP] Initialization error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"

      const errorResult: InitResponse = {
        success: false,
        error: "Network Error",
        details: errorMessage,
      }

      setInitResult(errorResult)
      setRawResponse(`Network Error: ${errorMessage}`)

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-blue-600" />
          Database Setup & Management
        </h1>
        <p className="text-gray-600">Initialize database tables and configure the owner account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Database Status
                <Button variant="outline" size="sm" onClick={checkDatabaseStatus} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </Button>
              </CardTitle>
              <CardDescription>Current state of database tables and accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {!status ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Loading database status...</p>
                </div>
              ) : status.success ? (
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center gap-2">
                    {status.data?.database_ready ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${status.data?.database_ready ? "text-green-600" : "text-red-600"}`}>
                      {status.data?.database_ready ? "Database Ready" : "Database Not Ready"}
                    </span>
                  </div>

                  {/* Tables Status */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Database Tables</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-2">
                        {status.data?.tables.users ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">Users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.data?.tables.sessions ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">Sessions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {status.data?.tables.recipes ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">Recipes</span>
                      </div>
                    </div>
                  </div>

                  {/* Counts */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Data Counts</h4>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Users: {status.data?.counts.users || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Recipes: {status.data?.counts.recipes || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Account Status */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Owner Account</h4>
                    <div className="flex items-center gap-2">
                      {status.data?.owner.exists ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm ${status.data?.owner.exists ? "text-green-600" : "text-red-600"}`}>
                        {status.data?.owner.exists ? "Owner account exists" : "Owner account missing"}
                      </span>
                    </div>

                    {status.data?.owner.info && (
                      <Card className="border-green-300 mt-2">
                        <CardHeader className="bg-green-50 pb-2">
                          <CardTitle className="text-green-700 text-sm">Owner Account Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 pt-2">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3" />
                            <span>Username: {status.data.owner.info.username}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3" />
                            <span>Email: {status.data.owner.info.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Settings className="w-3 h-3" />
                            <span>
                              Role: <Badge variant="default">{status.data.owner.info.role}</Badge>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3" />
                            <span>Created: {new Date(status.data.owner.info.created_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {status.error}
                    {status.details && (
                      <>
                        <br />
                        <strong>Details:</strong> {status.details}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Owner Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Owner Account Configuration</CardTitle>
              <CardDescription>Configure the owner account credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={ownerConfig.username}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={ownerConfig.email}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={ownerConfig.password}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={ownerConfig.role}
                    onChange={(e) => setOwnerConfig({ ...ownerConfig, role: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Actions</CardTitle>
              <CardDescription>Initialize or reinitialize the database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => initializeDatabase(false)}
                disabled={isInitializing}
                className="w-full"
                variant="default"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Initialize Database
                  </>
                )}
              </Button>

              <Button
                onClick={() => initializeDatabase(true)}
                disabled={isInitializing}
                className="w-full"
                variant="destructive"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Reinitializing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reinitialize Database (Drop & Recreate)
                  </>
                )}
              </Button>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Reinitialize</strong> will drop all existing tables and data, then recreate them with the new
                  owner configuration.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!initResult ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No initialization performed yet</p>
                </div>
              ) : (
                <Tabs defaultValue="result" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="result">Result</TabsTrigger>
                    <TabsTrigger value="raw">Raw Response</TabsTrigger>
                  </TabsList>

                  <TabsContent value="result" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {initResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${initResult.success ? "text-green-600" : "text-red-600"}`}>
                          {initResult.success ? "Success" : "Failed"}
                        </span>
                      </div>

                      {initResult.message && (
                        <Alert variant={initResult.success ? "default" : "destructive"}>
                          <AlertDescription>{initResult.message}</AlertDescription>
                        </Alert>
                      )}

                      {initResult.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {initResult.error}
                            {initResult.details && (
                              <>
                                <br />
                                <strong>Details:</strong> {initResult.details}
                              </>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {initResult.data?.credentials && (
                        <Card className="border-blue-300">
                          <CardHeader className="bg-blue-50">
                            <CardTitle className="text-blue-700 text-sm flex items-center gap-2">
                              <Key className="w-4 h-4" />
                              Owner Login Credentials
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3" />
                              <span>
                                Email:{" "}
                                <code className="bg-gray-100 px-2 py-1 rounded">
                                  {initResult.data.credentials.email}
                                </code>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Key className="w-3 h-3" />
                              <span>
                                Password:{" "}
                                <code className="bg-gray-100 px-2 py-1 rounded">
                                  {initResult.data.credentials.password}
                                </code>
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {initResult.data?.owner && (
                        <Card className="border-green-300">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="text-green-700 text-sm">Owner Account Created</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p>
                              <strong>ID:</strong> {initResult.data.owner.id}
                            </p>
                            <p>
                              <strong>Username:</strong> {initResult.data.owner.username}
                            </p>
                            <p>
                              <strong>Email:</strong> {initResult.data.owner.email}
                            </p>
                            <p>
                              <strong>Role:</strong> <Badge variant="default">{initResult.data.owner.role}</Badge>
                            </p>
                            {initResult.data.reinitialized && (
                              <p className="text-orange-600 font-medium">Database was reinitialized</p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="raw" className="mt-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Raw API Response</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                        {rawResponse || "No response yet"}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/login")} className="w-full">
                Go to Login Page
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/debug-owner-login")}
                className="w-full"
              >
                Debug Owner Login
              </Button>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = "/admin")} className="w-full">
                Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
