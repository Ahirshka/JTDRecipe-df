"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Database, User, Settings } from "lucide-react"

interface TestResult {
  success: boolean
  message: string
  error?: string
  details?: any
}

interface InitResult {
  success: boolean
  message: string
  owner?: {
    email: string
    password: string
    role: string
    created?: boolean
  }
  tables_created?: string[]
  error?: string
}

export default function DatabaseSetupPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [initResult, setInitResult] = useState<InitResult | null>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  const testDatabaseConnection = async () => {
    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/test/database", {
        method: "GET",
      })

      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test database connection",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const initializeDatabase = async () => {
    setIsInitializing(true)
    setInitResult(null)

    try {
      const response = await fetch("/api/init-db", {
        method: "POST",
      })

      const data = await response.json()
      setInitResult(data)
    } catch (error) {
      setInitResult({
        success: false,
        message: "Failed to initialize database",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Setup</h1>
          <p className="text-gray-600">Test your database connection and initialize the recipe site database</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Database Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection
              </CardTitle>
              <CardDescription>
                Test your Neon database connection using the DATABASE_URL environment variable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testDatabaseConnection} disabled={isTestingConnection} className="w-full">
                {isTestingConnection ? "Testing Connection..." : "Test Database Connection Now"}
              </Button>

              {testResult && (
                <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                      <div className="font-medium">{testResult.message}</div>
                      {testResult.error && <div className="text-sm mt-1 opacity-80">{testResult.error}</div>}
                      {testResult.details && (
                        <pre className="text-xs mt-2 p-2 bg-white rounded border overflow-auto">
                          {JSON.stringify(testResult.details, null, 2)}
                        </pre>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Database Initialization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Database Initialization
              </CardTitle>
              <CardDescription>Create database tables and set up the owner account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={initializeDatabase}
                disabled={isInitializing || (testResult && !testResult.success)}
                className="w-full"
                variant={testResult?.success ? "default" : "secondary"}
              >
                {isInitializing ? "Initializing Database..." : "Initialize Database & Create Owner Account"}
              </Button>

              {!testResult?.success && testResult && (
                <p className="text-sm text-gray-600">⚠️ Please test the database connection first</p>
              )}

              {initResult && (
                <Alert className={initResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {initResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={initResult.success ? "text-green-800" : "text-red-800"}>
                      <div className="font-medium">{initResult.message}</div>
                      {initResult.error && <div className="text-sm mt-1 opacity-80">{initResult.error}</div>}
                      {initResult.owner && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <div className="font-medium text-gray-900 mb-2">Owner Account Details:</div>
                          <div className="text-sm space-y-1">
                            <div>
                              <strong>Email:</strong> {initResult.owner.email}
                            </div>
                            <div>
                              <strong>Password:</strong> {initResult.owner.password}
                            </div>
                            <div>
                              <strong>Role:</strong> {initResult.owner.role}
                            </div>
                            {initResult.owner.created && <div className="text-green-600">✅ New account created</div>}
                          </div>
                        </div>
                      )}
                      {initResult.tables_created && (
                        <div className="mt-2 text-sm">
                          <strong>Tables created:</strong> {initResult.tables_created.join(", ")}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        {initResult?.success && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Database successfully initialized with all tables</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Owner account created and ready to use</span>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Ready to login!</h4>
                  <p className="text-blue-800 text-sm">
                    You can now go to the{" "}
                    <a href="/login" className="underline font-medium">
                      login page
                    </a>{" "}
                    and sign in with:
                  </p>
                  <div className="mt-2 text-sm font-mono bg-white p-2 rounded border">
                    <div>Email: aaronhirshka@gmail.com</div>
                    <div>Password: Morton2121</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environment Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Environment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>DATABASE_URL</span>
                <span className={process.env.DATABASE_URL ? "text-green-600" : "text-red-600"}>
                  {typeof window === "undefined" && process.env.DATABASE_URL ? "✅ Configured" : "❌ Not configured"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
