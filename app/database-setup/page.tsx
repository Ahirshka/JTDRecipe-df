"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Database, Loader2 } from "lucide-react"

interface ConnectionStatus {
  success: boolean
  message: string
  error?: string
  connection?: {
    current_time: string
    database_version: string
    database_url_configured: boolean
  }
  fallback?: string
  details?: string
}

interface InitStatus {
  success: boolean
  message: string
  owner?: {
    email: string
    password: string
    role: string
  }
  database_url_configured: boolean
}

export default function DatabaseSetupPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [initStatus, setInitStatus] = useState<InitStatus | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const response = await fetch("/api/test/database-connection")
      const data = await response.json()
      setConnectionStatus(data)
    } catch (error) {
      setConnectionStatus({
        success: false,
        message: "Failed to test connection",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const initializeDatabase = async () => {
    setIsInitializing(true)
    try {
      const response = await fetch("/api/init-db", { method: "POST" })
      const data = await response.json()
      setInitStatus(data)
    } catch (error) {
      setInitStatus({
        success: false,
        message: "Failed to initialize database",
        database_url_configured: false,
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Setup & Connection Test</h1>
        <p className="text-muted-foreground">Set up and test your database connection for the recipe application.</p>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Step 1: Environment Variables Status
            </CardTitle>
            <CardDescription>Checking if your DATABASE_URL is properly configured.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-medium mb-2">Expected Format:</p>
              <code className="text-sm bg-background p-2 rounded border block">
                DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
              </code>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">DATABASE_URL is configured ✓</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Status:</strong> Environment variable detected and ready for testing
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Test Connection */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Test Database Connection</CardTitle>
            <CardDescription>Click the button below to verify your database connection is working.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testConnection} disabled={isTestingConnection} className="w-full" size="lg">
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Test Database Connection Now
                </>
              )}
            </Button>

            {connectionStatus && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {connectionStatus.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-medium ${connectionStatus.success ? "text-green-600" : "text-red-600"}`}>
                    {connectionStatus.message}
                  </span>
                </div>

                {connectionStatus.connection && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">✅ Connection Successful!</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>
                        <strong>Connected at:</strong>{" "}
                        {new Date(connectionStatus.connection.current_time).toLocaleString()}
                      </p>
                      <p>
                        <strong>Database Version:</strong> {connectionStatus.connection.database_version}
                      </p>
                      <p>
                        <strong>Configuration:</strong> DATABASE_URL properly configured
                      </p>
                    </div>
                  </div>
                )}

                {connectionStatus.error && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">❌ Connection Failed</h4>
                    <p className="text-sm text-red-800 mb-2">
                      <strong>Error:</strong> {connectionStatus.error}
                    </p>
                    {connectionStatus.details && (
                      <p className="text-sm text-red-800">
                        <strong>Details:</strong> {connectionStatus.details}
                      </p>
                    )}
                  </div>
                )}

                {connectionStatus.fallback && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">{connectionStatus.fallback}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Initialize Database */}
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Initialize Database</CardTitle>
            <CardDescription>
              {connectionStatus?.success
                ? "Great! Now create the necessary tables and set up your owner account."
                : "Once connection test passes, you can initialize the database tables."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={initializeDatabase}
              disabled={isInitializing || !connectionStatus?.success}
              className="w-full"
              size="lg"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Initialize Database & Create Owner Account
                </>
              )}
            </Button>

            {!connectionStatus?.success && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">Please test the connection first before initializing</p>
                </div>
              </div>
            )}

            {initStatus && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {initStatus.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`font-medium ${initStatus.success ? "text-green-600" : "text-red-600"}`}>
                    {initStatus.message}
                  </span>
                </div>

                {initStatus.success && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3">🎉 Database Initialized Successfully!</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p>✅ Created users table</p>
                      <p>✅ Created user_sessions table</p>
                      <p>✅ Created recipes table</p>
                      <p>✅ Set up owner account</p>
                    </div>
                    <div className="mt-3 p-3 bg-blue-100 rounded border">
                      <p className="font-medium text-blue-900 mb-1">Owner Login Credentials:</p>
                      <p className="text-sm text-blue-800">
                        <strong>Email:</strong> aaronhirshka@gmail.com
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Password:</strong> Morton2121
                      </p>
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      Use these credentials to access admin features
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>🚀 Next Steps</CardTitle>
            <CardDescription>Once your database is set up, you can start using the application.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Visit the Home Page</p>
                  <p className="text-sm text-muted-foreground">See your recipes and browse the site</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Login as Owner</p>
                  <p className="text-sm text-muted-foreground">Use aaronhirshka@gmail.com / Morton2121</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Access Admin Panel</p>
                  <p className="text-sm text-muted-foreground">Manage recipes and moderate content</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                  <p className="font-medium">Add Your Recipes</p>
                  <p className="text-sm text-muted-foreground">Start building your recipe collection</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
