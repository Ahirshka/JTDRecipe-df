"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, RefreshCw, CheckCircle, AlertCircle, Users, Settings, Trash2, User, Mail, Key } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DatabaseStatus {
  connected: boolean
  tables: { name: string; exists: boolean; count?: number }[]
  users: any[]
}

interface SetupResult {
  success: boolean
  message?: string
  error?: string
  admin?: {
    username: string
    email: string
    password: string
  }
}

export default function DatabaseSetupPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null)

  // Admin credentials
  const [adminUsername, setAdminUsername] = useState("aaronhirshka")
  const [adminEmail, setAdminEmail] = useState("aaronhirshka@gmail.com")
  const [adminPassword, setAdminPassword] = useState("Morton2121")

  // Load database status on mount
  useEffect(() => {
    loadDatabaseStatus()
  }, [])

  const loadDatabaseStatus = async () => {
    console.log("🔍 [DB-SETUP] Loading database status...")

    try {
      const response = await fetch("/api/database/init")
      const result = await response.json()

      if (result.success) {
        setStatus(result.status)
        console.log("✅ [DB-SETUP] Database status loaded")
      } else {
        console.error("❌ [DB-SETUP] Failed to load status:", result.error)
        toast({
          title: "Error",
          description: "Failed to load database status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Network error:", error)
      toast({
        title: "Network Error",
        description: "Failed to connect to database",
        variant: "destructive",
      })
    }
  }

  const initializeDatabase = async () => {
    setIsLoading(true)
    setSetupResult(null)

    try {
      console.log("🔄 [DB-SETUP] Initializing database...")

      const response = await fetch("/api/database/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "init",
          adminUsername,
          adminEmail,
          adminPassword,
        }),
      })

      const result: SetupResult = await response.json()
      setSetupResult(result)

      if (result.success) {
        toast({
          title: "Success!",
          description: "Database initialized and admin user created",
        })
        console.log("✅ [DB-SETUP] Database initialized successfully")
        await loadDatabaseStatus() // Refresh status
      } else {
        toast({
          title: "Setup Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        })
        console.error("❌ [DB-SETUP] Setup failed:", result.error)
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      setSetupResult({
        success: false,
        error: "Network Error",
        message: errorMessage,
      })

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetDatabase = async () => {
    if (!confirm("Are you sure you want to reset the database? This will delete all data!")) {
      return
    }

    setIsLoading(true)
    setSetupResult(null)

    try {
      console.log("🗑️ [DB-SETUP] Resetting database...")

      const response = await fetch("/api/database/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reset",
          adminUsername,
          adminEmail,
          adminPassword,
        }),
      })

      const result: SetupResult = await response.json()
      setSetupResult(result)

      if (result.success) {
        toast({
          title: "Database Reset!",
          description: "Database reset and admin user created",
        })
        console.log("✅ [DB-SETUP] Database reset successfully")
        await loadDatabaseStatus() // Refresh status
      } else {
        toast({
          title: "Reset Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        })
        console.error("❌ [DB-SETUP] Reset failed:", result.error)
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Network error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      setSetupResult({
        success: false,
        error: "Network Error",
        message: errorMessage,
      })

      toast({
        title: "Network Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-blue-600" />
          Database Setup
        </h1>
        <p className="text-gray-600">Initialize your recipe sharing platform database</p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Setup Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Admin User Configuration
                  </CardTitle>
                  <CardDescription>Configure the default admin user credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Admin Username</Label>
                    <Input
                      id="adminUsername"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Enter admin username"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="Enter admin email"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={initializeDatabase} disabled={isLoading} className="flex-1">
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 mr-2" />
                          Initialize Database
                        </>
                      )}
                    </Button>

                    <Button onClick={resetDatabase} disabled={isLoading} variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Default Credentials */}
              <Card className="border-green-300">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Default Owner Credentials
                  </CardTitle>
                  <CardDescription>These are the recommended owner credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Username:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">aaronhirshka</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Email:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">aaronhirshka@gmail.com</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Password:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">Morton2121</code>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setAdminUsername("aaronhirshka")
                      setAdminEmail("aaronhirshka@gmail.com")
                      setAdminPassword("Morton2121")
                      toast({
                        title: "Credentials filled",
                        description: "Default owner credentials have been filled",
                      })
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Use Default Credentials
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Setup Results */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Setup Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {!setupResult ? (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Initialize Database" to begin setup</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {setupResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${setupResult.success ? "text-green-600" : "text-red-600"}`}>
                          {setupResult.success ? "Setup Successful" : "Setup Failed"}
                        </span>
                      </div>

                      {setupResult.message && (
                        <Alert variant={setupResult.success ? "default" : "destructive"}>
                          <AlertDescription>{setupResult.message}</AlertDescription>
                        </Alert>
                      )}

                      {setupResult.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Error:</strong> {setupResult.error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {setupResult.admin && (
                        <Card className="border-green-300">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="text-green-700 text-sm">Admin User Created</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p>
                              <strong>Username:</strong> {setupResult.admin.username}
                            </p>
                            <p>
                              <strong>Email:</strong> {setupResult.admin.email}
                            </p>
                            <p>
                              <strong>Password:</strong> {setupResult.admin.password}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" onClick={loadDatabaseStatus} className="w-full bg-transparent">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/login")}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/debug-auth")}
                    className="w-full"
                  >
                    Debug Authentication
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Status
                <Button onClick={loadDatabaseStatus} size="sm" variant="outline">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!status ? (
                <div className="text-center py-8 text-gray-500">
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Loading database status...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {status.connected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${status.connected ? "text-green-600" : "text-red-600"}`}>
                      {status.connected ? "Database Connected" : "Database Disconnected"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Tables Status:</h4>
                    {status.tables.map((table) => (
                      <div key={table.name} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {table.exists ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-medium">{table.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={table.exists ? "default" : "destructive"}>
                            {table.exists ? "EXISTS" : "MISSING"}
                          </Badge>
                          {table.count !== undefined && <Badge variant="secondary">{table.count} rows</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users in Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!status?.users || status.users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found in database</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {status.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{user.username}</span>
                          <Badge variant="default">{user.role}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                        <Badge variant={user.is_verified ? "default" : "destructive"}>
                          {user.is_verified ? "Verified" : "Unverified"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
