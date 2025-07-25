"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database, CheckCircle, XCircle, RefreshCw, User, Table, AlertCircle, Play, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DatabaseStatus {
  tables: {
    users: boolean
    sessions: boolean
    recipes: boolean
  }
  owner: {
    exists: boolean
    info: any
  }
  status: string
}

interface InitResult {
  success: boolean
  message?: string
  error?: string
  details?: string
  data?: any
}

export default function DatabaseSetupPage() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initResult, setInitResult] = useState<InitResult | null>(null)
  const [rawResponse, setRawResponse] = useState("")

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
      console.log("📊 [DB-SETUP] Database status:", data)

      if (data.success) {
        setStatus(data.data)
      } else {
        toast({
          title: "Status Check Failed",
          description: data.error || "Failed to check database status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Status check error:", error)
      toast({
        title: "Network Error",
        description: "Failed to connect to database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setInitResult(null)
    setRawResponse("")

    try {
      console.log("🔄 [DB-SETUP] Initializing database...")

      const response = await fetch("/api/init-db", {
        method: "POST",
      })

      const responseText = await response.text()
      setRawResponse(responseText)

      let result: InitResult
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
          title: "Database Initialized!",
          description: "Database tables and owner account created successfully",
        })

        // Refresh status after successful initialization
        setTimeout(() => {
          checkDatabaseStatus()
        }, 1000)
      } else {
        toast({
          title: "Initialization Failed",
          description: result.error || "Database initialization failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ [DB-SETUP] Initialization error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown network error"

      const errorResult: InitResult = {
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

  const getStatusBadge = (exists: boolean) => {
    return exists ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Ready
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Missing
      </Badge>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="w-8 h-8 text-blue-600" />
          Database Setup
        </h1>
        <p className="text-gray-600">Initialize database tables and create the owner account</p>
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
              ) : (
                <div className="space-y-4">
                  {/* Overall Status */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Overall Status:</span>
                    <Badge
                      variant={status.status === "ready" ? "default" : "destructive"}
                      className={
                        status.status === "ready" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {status.status === "ready" ? "Ready" : "Needs Setup"}
                    </Badge>
                  </div>

                  {/* Tables Status */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Table className="w-4 h-4" />
                      Database Tables
                    </h4>
                    <div className="space-y-2 ml-6">
                      <div className="flex items-center justify-between">
                        <span>Users Table:</span>
                        {getStatusBadge(status.tables.users)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sessions Table:</span>
                        {getStatusBadge(status.tables.sessions)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Recipes Table:</span>
                        {getStatusBadge(status.tables.recipes)}
                      </div>
                    </div>
                  </div>

                  {/* Owner Account Status */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Owner Account
                    </h4>
                    <div className="ml-6">
                      <div className="flex items-center justify-between mb-2">
                        <span>Account Exists:</span>
                        {getStatusBadge(status.owner.exists)}
                      </div>
                      {status.owner.exists && status.owner.info && (
                        <div className="bg-green-50 p-3 rounded-lg space-y-1">
                          <p>
                            <strong>Username:</strong> {status.owner.info.username}
                          </p>
                          <p>
                            <strong>Email:</strong> {status.owner.info.email}
                          </p>
                          <p>
                            <strong>Role:</strong> <Badge variant="default">{status.owner.info.role}</Badge>
                          </p>
                          <p>
                            <strong>Status:</strong> <Badge variant="secondary">{status.owner.info.status}</Badge>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Initialize Button */}
          <Card>
            <CardHeader>
              <CardTitle>Initialize Database</CardTitle>
              <CardDescription>Create tables and owner account if they don't exist</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={initializeDatabase} disabled={isInitializing} className="w-full" size="lg">
                {isInitializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Initialize Database
                  </>
                )}
              </Button>

              {status?.status === "ready" && (
                <Alert className="mt-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Database is already initialized and ready to use!</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Initialization Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Initialization Results</CardTitle>
            </CardHeader>
            <CardContent>
              {!initResult ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Initialize Database" to begin setup</p>
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
                          {initResult.success ? "Initialization Successful" : "Initialization Failed"}
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

                      {initResult.data && (
                        <Card className="border-green-300">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="text-green-700 text-sm">Setup Details</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <p>
                              <strong>Database:</strong> {initResult.data.database}
                            </p>
                            {initResult.data.owner && (
                              <div>
                                <strong>Owner Account:</strong>
                                <div className="ml-4 mt-1">
                                  <p>ID: {initResult.data.owner.id}</p>
                                  <p>Username: {initResult.data.owner.username}</p>
                                  <p>Email: {initResult.data.owner.email}</p>
                                  <p>
                                    Role: <Badge variant="default">{initResult.data.owner.role}</Badge>
                                  </p>
                                </div>
                              </div>
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
                onClick={() => (window.location.href = "/test-recipe-submission")}
                className="w-full"
              >
                Test Recipe Submission
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
