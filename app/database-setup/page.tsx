"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, RefreshCw, AlertCircle, Play } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ConnectionResult {
  success: boolean
  message: string
  connection?: {
    current_time: string
    database_version: string
    database_url_configured: boolean
  }
  error?: string
  details?: string
  fallback?: string
  environment_check?: {
    database_url: boolean
    node_env: string
  }
}

interface InitResult {
  success: boolean
  message: string
  owner?: {
    email: string
    password: string
    role: string
  }
  database_url_configured: boolean
  error?: string
}

export default function DatabaseSetupPage() {
  const [connectionResult, setConnectionResult] = useState<ConnectionResult | null>(null)
  const [initResult, setInitResult] = useState<InitResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const { toast } = useToast()

  const testConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/test/database-connection")
      const data = await response.json()
      setConnectionResult(data)

      if (data.success) {
        toast({
          title: "Connection Successful!",
          description: "Database is connected and ready",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Unable to connect to database",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorResult: ConnectionResult = {
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to test connection",
        fallback: "Using mock data instead",
      }
      setConnectionResult(errorResult)
      toast({
        title: "Test Failed",
        description: "Unable to test database connection",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const initializeDatabase = async () => {
    setInitializing(true)
    try {
      const response = await fetch("/api/init-db", { method: "POST" })
      const data = await response.json()
      setInitResult(data)

      if (data.success) {
        toast({
          title: "Database Initialized!",
          description: "Tables created and owner account set up",
        })
      } else {
        toast({
          title: "Initialization Failed",
          description: data.error || "Unable to initialize database",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorResult: InitResult = {
        success: false,
        error: "Network error",
        message: "Failed to initialize database",
        database_url_configured: false,
      }
      setInitResult(errorResult)
      toast({
        title: "Initialization Failed",
        description: "Unable to initialize database",
        variant: "destructive",
      })
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Setup</h1>
          <p className="text-gray-600">Test your database connection and initialize your recipe site</p>
        </div>

        {/* Connection Test */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Connection Test
            </CardTitle>
            <CardDescription>Test your DATABASE_URL environment variable and verify connectivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button onClick={testConnection} disabled={testing} className="w-full">
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Test Database Connection Now
                  </>
                )}
              </Button>

              {connectionResult && (
                <div className="mt-4">
                  {connectionResult.success ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>✅ Connection Successful!</strong>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <strong>Database:</strong> {connectionResult.connection?.database_version}
                          </p>
                          <p>
                            <strong>Time:</strong> {connectionResult.connection?.current_time}
                          </p>
                          <p>
                            <strong>Status:</strong> Ready for initialization
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>❌ Connection Failed</strong>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <strong>Error:</strong> {connectionResult.error}
                          </p>
                          {connectionResult.details && (
                            <p>
                              <strong>Details:</strong> {connectionResult.details}
                            </p>
                          )}
                          <p>
                            <strong>Fallback:</strong> {connectionResult.fallback}
                          </p>
                          {connectionResult.environment_check && (
                            <div className="mt-2">
                              <p>
                                <strong>Environment Check:</strong>
                              </p>
                              <p>
                                • DATABASE_URL configured:{" "}
                                {connectionResult.environment_check.database_url ? "✅" : "❌"}
                              </p>
                              <p>• Node environment: {connectionResult.environment_check.node_env}</p>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Database Initialization */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Initialization
            </CardTitle>
            <CardDescription>Create tables and set up your owner account (only run this once)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={initializeDatabase}
                disabled={initializing || (connectionResult && !connectionResult.success)}
                className="w-full"
                variant={connectionResult?.success ? "default" : "secondary"}
              >
                {initializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Initializing Database...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Initialize Database & Create Owner Account
                  </>
                )}
              </Button>

              {!connectionResult?.success && connectionResult && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Test your database connection first before initializing</AlertDescription>
                </Alert>
              )}

              {initResult && (
                <div className="mt-4">
                  {initResult.success ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>✅ Database Initialized Successfully!</strong>
                        {initResult.owner && (
                          <div className="mt-3 p-3 bg-white border border-green-200 rounded">
                            <p className="font-medium mb-2">Owner Account Created:</p>
                            <div className="space-y-1 text-sm font-mono">
                              <p>
                                <strong>Email:</strong> {initResult.owner.email}
                              </p>
                              <p>
                                <strong>Password:</strong> {initResult.owner.password}
                              </p>
                              <p>
                                <strong>Role:</strong> {initResult.owner.role}
                              </p>
                            </div>
                            <p className="text-xs mt-2 text-green-700">
                              Save these credentials! You can now log in and access admin features.
                            </p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-red-200 bg-red-50">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>❌ Initialization Failed</strong>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <strong>Error:</strong> {initResult.error}
                          </p>
                          <p>
                            <strong>Database URL Configured:</strong>{" "}
                            {initResult.database_url_configured ? "Yes" : "No"}
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardDescription>Current status of your database setup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="mb-2">
                  {connectionResult?.success ? (
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  ) : connectionResult ? (
                    <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                  ) : (
                    <Database className="w-8 h-8 text-gray-400 mx-auto" />
                  )}
                </div>
                <p className="font-medium">Connection</p>
                <Badge variant={connectionResult?.success ? "default" : "secondary"}>
                  {connectionResult?.success ? "Connected" : connectionResult ? "Failed" : "Not Tested"}
                </Badge>
              </div>

              <div className="text-center">
                <div className="mb-2">
                  {initResult?.success ? (
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  ) : initResult ? (
                    <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                  ) : (
                    <Database className="w-8 h-8 text-gray-400 mx-auto" />
                  )}
                </div>
                <p className="font-medium">Database</p>
                <Badge variant={initResult?.success ? "default" : "secondary"}>
                  {initResult?.success ? "Initialized" : initResult ? "Failed" : "Not Initialized"}
                </Badge>
              </div>

              <div className="text-center">
                <div className="mb-2">
                  {initResult?.success ? (
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  ) : (
                    <Database className="w-8 h-8 text-gray-400 mx-auto" />
                  )}
                </div>
                <p className="font-medium">Ready</p>
                <Badge variant={initResult?.success ? "default" : "secondary"}>
                  {initResult?.success ? "Ready to Use" : "Setup Required"}
                </Badge>
              </div>
            </div>

            {initResult?.success && (
              <div className="mt-6 text-center">
                <p className="text-green-600 font-medium mb-2">🎉 Your recipe site is ready!</p>
                <div className="space-x-2">
                  <Button asChild>
                    <a href="/login">Login as Owner</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/">View Site</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
